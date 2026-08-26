# Sarthi Judge Engine — Phase 12 Architecture Review & Deep Dive
## Technical Resolutions for Container Security, Fenced Leases & Observability

---

## 1. Container Security & Trust Boundaries

### 1.1 Trust Boundary Architecture
The Phase 12 architecture establishes four distinct security trust boundaries:

```
[ Boundary 1: Untrusted Public Internet / Client ]
                         │
                         ▼ (HTTP REST API / Auth Middleware)
[ Boundary 2: Trusted Application Server & Gateway ]
                         │
                         ▼ (Redis Queue / Worker Process)
[ Boundary 3: Host OS & Docker Daemon Control Plane ]
                         │
                         ▼ (Isolated OCI Container Runtime)
[ Boundary 4: Untrusted Student Code Sandbox ]
```

### 1.2 Host / Container Security Flags Audit
Every container spawned by `DockerContainerSandboxDriver` must enforce the following flags:

| Security Flag | Technical Purpose & Threat Mitigation |
| :--- | :--- |
| `--network none` | Disables network interfaces except loopback `lo`. Prevents data exfiltration, SSRF, reverse shell callbacks, and network scanning. |
| `--read-only` | Mounts container root filesystem `/` as immutable read-only. Prevents malware persistence, system binary modification, and rootkit installation. |
| `--tmpfs /workspace:rw,exec,nosuid,size=64m` | Ephemeral `tmpfs` execution workspace for source code, compilation objects, and binary execution. |
| `--tmpfs /tmp:rw,noexec,nosuid,size=16m` | System temporary space. `noexec` strictly prevents execution of dropped malware binaries in system temp directories. |
| `--user 1000:1000` | Forces execution under non-root unprivileged user `sandbox_user`. Ensures root inside container does not map to host root. |
| `--cap-drop=ALL` | Drops all Linux capabilities (`CAP_SYS_ADMIN`, `CAP_NET_RAW`, `CAP_SYS_PTRACE`, `CAP_MKNOD`, etc.). |
| `--security-opt no-new-privileges:true` | Prevents sub-processes from acquiring extra privileges via `setuid` or `setgid` binaries. |
| `--pids-limit 64` | Restricts maximum process/thread count to 64. Prevents fork bomb Denial-of-Service (`:(){ :|:& };:`) attacks. |
| `--cpus 1.5` | Limits container CPU usage via cgroups v2. |
| `--memory 512m` & `--memory-swap 512m` | Hard memory quota. Disables swap amplification to prevent host RAM exhaustion. |
| `--security-opt seccomp=<profile.json>` | Custom seccomp-bpf profile filtering forbidden syscalls at the Linux kernel level. |

---

## 2. Runtime Image Lifecycle & Digest Pinning

### 2.1 Immutable Image Digest Pinning
To mitigate supply-chain attacks and ensure deterministic runtime execution across workers, image tags (e.g. `latest` or `3.11`) are strictly prohibited. All runtime images must be pinned by cryptographic **sha256 digest**:

```javascript
export const RUNTIME_IMAGE_MAP = {
  python: 'sarthi-judge-python@sha256:a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
  javascript: 'sarthi-judge-node@sha256:b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01',
  cpp: 'sarthi-judge-cpp@sha256:c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012',
  java: 'sarthi-judge-java@sha256:d4e5f67890123456789abcdef0123456789abcdef0123'
};
```

### 2.2 Image Lifecycle & Pre-Warming
1. **Pre-Pulling at Worker Startup**: `JudgeWorker` verifies image presence locally during startup via `docker image inspect <digest>`. If missing, pre-pulls images before setting worker readiness = `true`.
2. **Offline Execution Policy**: Containers run with `--pull never`. Dynamic image downloading during job evaluation is strictly forbidden to guarantee zero runtime latency spikes and prevent dynamic supply-chain compromise.

---

## 3. Runtime-Tailored Seccomp Syscall Filtering

### 3.1 Seccomp Syscall Requirements Matrix
Interpreted vs compiled vs JVM runtimes require different kernel syscalls during startup and execution:

| Language | Required Startup / Execution Syscalls | Forbidden / Trapped Syscalls |
| :--- | :--- | :--- |
| **Python 3** | `read`, `write`, `execve`, `mmap`, `munmap`, `brk`, `openat`, `fstat`, `futex`, `sysinfo`, `rt_sigaction` | `ptrace`, `unshare`, `kexec_load`, `bpf`, `init_module`, `syslog`, `mount`, `pivot_root`, `reboot` |
| **Node.js** | `read`, `write`, `execve`, `mmap`, `epoll_create1`, `epoll_ctl`, `epoll_wait`, `futex`, `getrandom`, `eventfd2` | `ptrace`, `unshare`, `kexec_load`, `bpf`, `init_module`, `syslog`, `mount`, `pivot_root`, `socket` |
| **C++** | `read`, `write`, `execve`, `mmap`, `mprotect`, `brk`, `exit_group`, `arch_prctl`, `set_tid_address` | `ptrace`, `unshare`, `kexec_load`, `bpf`, `init_module`, `syslog`, `mount`, `pivot_root` |
| **Java JVM** | `read`, `write`, `execve`, `mmap`, `mprotect`, `futex`, `clock_gettime`, `getrandom`, `sched_yield`, `clone` (thread pool) | `ptrace`, `unshare`, `kexec_load`, `bpf`, `init_module`, `syslog`, `mount`, `pivot_root`, `socket` |

### 3.2 Seccomp Policy Construction
- Default action: `SCMP_ACT_ERRNO` (EPERM — Operation Not Permitted).
- Whitelist rule: Explicitly allow required syscalls listed in language profile.
- Violation handling: Attempts to invoke forbidden syscalls return `EPERM`, causing the process to fail with `RUNTIME_ERROR` or `PROCESS_ERROR` without harming the host OS.

---

## 4. Execution Filesystem Model & Dual-Mount Policy

### 4.1 Ephemeral Filesystem Layout

```
Container Virtual Root Filesystem (/)  ──►  [ READ-ONLY / IMMUTABLE ]
├── /usr, /lib, /bin, /etc           ──►  Read-only system binaries & libraries
├── /tmp                             ──►  Mounted tmpfs (rw, noexec, nosuid, size=16m)
└── /workspace                       ──►  Mounted tmpfs (rw, exec, nosuid, size=64m)
    └── /workspace/sarthi_exec_<jobId>/
        ├── harness.py / solution.cpp ──►  Driver harness source code
        ├── solution.o / Solution.class──►  Compiled binary artifacts (C++/Java)
        └── result_envelope.json      ──►  Sentinel JSON output payload
```

### 4.2 Security / Compatibility Tradeoff Resolution
- **Source Files Location**: Written inside ephemeral workspace directory `/workspace/sarthi_exec_<jobId>/harness.py` or `solution.cpp`.
- **Compiler Artifacts & Executables**: C++ binaries (`solution.o`) and Java compiled bytecode (`Solution.class`) are written and executed directly from `/workspace/sarthi_exec_<jobId>/`. `/workspace` is mounted `rw,exec,nosuid,size=64m`.
- **System `/tmp` Mount**: General system temporary space `/tmp` is mounted separately as `tmpfs` `rw,noexec,nosuid,size=16m`.
- **Tradeoff Rationale**: Restricting binary execution strictly to `/workspace` while enforcing `noexec` on `/tmp` prevents untrusted scripts from dropping and executing hidden payload binaries in system temporary space, while providing 100% execution compatibility for compiled C++/Java binaries and interpreted Python/Node driver harnesses.

---

## 5. Worker Crash Recovery & Fenced Job Lease Engine

### 5.1 Fenced Job Lease Domain Model
To prevent duplicate job execution when a worker stalls, suffers network partitioning, or crashes, Phase 12 introduces a **Fenced Job Lease Ownership Model**:

```javascript
class FencedJobLease {
  workerId: string;       // e.g. "worker_node_01"
  leaseId: string;        // UUIDv4 Fencing Token e.g. "lease_9f8a7b6c-..."
  attemptCount: number;   // Attempt counter (1..3)
  leaseExpiresAt: string; // ISO Timestamp e.g. "2026-08-22T19:20:00.000Z"
  renewedAt: string;      // Last renewal timestamp
}
```

### 5.2 Lease Renewal & State-Transition Fencing
1. **Claiming**: When Worker A claims a job, `IExecutionQueue` assigns a unique UUIDv4 `leaseId` fencing token and sets `leaseExpiresAt = Date.now() + 30000ms` (30s TTL).
2. **Renewal**: While Worker A processes the job, a background worker timer extends `leaseExpiresAt` every 10 seconds.
3. **Reclaim Rule**: If `Date.now() > leaseExpiresAt`, the lease expires. A background `WorkerLivenessMonitor` reaper detects the expired lease, invalidates `leaseId`, increments `attemptCount`, and re-enqueues the job to `IExecutionQueue`.
4. **State-Transition Fencing**: If Worker A recovers after a network partition and attempts to call `queue.updateJob(job)` or `queue.ack(job.jobId)` with its old `leaseId`, `JobStateMachine` verifies:
   `currentJob.leaseId === submittedLeaseId`
   If `leaseId` does not match, the submission is rejected as **fenced**, preventing duplicate execution and state corruption.

---

## 6. Tri-State Worker Health Framework

Phase 12 explicitly separates worker health into three distinct probes:

```
[ Worker Health Framework ]
├── Liveness Probe  ──► Is the Node process running and event loop unblocked?
├── Readiness Probe ──► Is Redis connected AND Docker daemon responsive?
└── Capacity Probe  ──► Is activeCount < maxConcurrency?
```

- **Liveness Ping**: Heartbeat emitted every 5s (`worker:liveness:<workerId>`).
- **Readiness Check**: Worker pings Docker daemon (`docker info`) every 10s. If Docker daemon drops, readiness is set to `false`, and worker temporarily pauses queue polling.
- **Capacity Metric**: Worker reports `activeCount` vs `maxConcurrency` (e.g., 3/5 active slots).

---

## 7. Metrics Security & Surface Hardening

- **Internal Surface Binding**: The Prometheus metrics endpoint `/api/v1/judge/metrics` is bound to internal localhost / private cluster IP `127.0.0.1:9090` or protected by authentication middleware requiring header `X-Internal-Metrics-Token`.
- **Public Endpoint Protection**: Public HTTP router (`judge.router.js`) does NOT expose metrics without authorization.

---

## 8. Metrics Cardinality & Label Policy (Worker ID Exclusion)

### 8.1 Cardinality & Scaling Resolution
In Phase 13, horizontal auto-scaling will dynamically launch and terminate ephemeral worker instances. Including `worker_id` as a Prometheus metric label would cause high label cardinality and memory explosion in monitoring systems (Grafana / Prometheus).

- **`worker_id` Label Policy**: `worker_id` is **EXCLUDED** from Prometheus metric labels. Worker metrics are aggregated globally across cluster gauges (`sarthi_judge_active_workers_total`, `sarthi_judge_worker_capacity_utilization`).
- **Worker Identity Logging**: Individual worker identity (`worker_id`) is strictly confined to structured context logs (`JudgeLogger`) for trace debugging.

### 8.2 Label Policy Summary
- **PROHIBITED Labels**: `jobId`, `userId`, `submissionId`, `problemId`, `traceId`, `code`, `errorMessage`, `worker_id`.
- **PERMITTED Labels (Low Bounded Cardinality)**:
  - `execution_type`: `RUN` | `SUBMIT`
  - `language`: `python` | `javascript` | `cpp` | `java`
  - `priority`: `HIGH` | `NORMAL`
  - `verdict`: `ACCEPTED` | `WRONG_ANSWER` | `TIME_LIMIT_EXCEEDED` | `MEMORY_LIMIT_EXCEEDED` | `COMPILE_ERROR` | `RUNTIME_ERROR`
  - `status`: `PASSED` | `FAILED` | `RETRYING`

---

## 9. Observability Context Propagation

Correlation and tracing IDs flow continuously through the system pipeline:

```
HTTP Request (Headers: x-correlation-id, x-trace-id)
   │
   ▼
JudgeGatewayService.submitJob()
   │ (Injects correlationId & traceId into ExecutionJob)
   ▼
ExecutionJob { jobId, correlationId, traceId }
   │
   ▼
IExecutionQueue / Redis
   │
   ▼
JudgeWorker.processJob(job)
   │ (Binds context to JudgeLogger & JudgeMetricsCollector)
   ▼
CoreJudgeExecutor.execute()
   │
   ▼
DockerContainerSandboxDriver.execute()
   │
   ▼
Structured JSON Log Output:
{
  "timestamp": "2026-08-22T19:20:00.123Z",
  "level": "INFO",
  "service": "sarthi-judge",
  "correlationId": "corr_9f8a7b6c5d",
  "traceId": "trace_1a2b3c4d",
  "jobId": "job_01HXYZ",
  "event": "JOB_COMPLETED",
  "executionType": "SUBMIT",
  "language": "python",
  "verdict": "ACCEPTED",
  "durationMs": 142
}
```

---

## 10. Logging Privacy & Redaction Directives

To enforce privacy compliance and prevent credential leakage, `JudgeLogger` implements strict redaction rules:

- **NEVER LOG**:
  1. Student source code (`job.code`).
  2. Database URIs (`MONGO_URI`, `REDIS_URL`).
  3. Security tokens / JWT secrets (`JWT_SECRET`).
  4. Raw input/output testcase strings marked `isHidden: true`.
- **ALWAYS LOG**:
  1. Metadata identifiers (`jobId`, `userId`, `problemId`, `executionType`, `language`, `workerId`).
  2. Lifecycle events (`JOB_QUEUED`, `JOB_CLAIMED`, `JOB_COMPLETED`, `JOB_RETRYING`).
  3. Execution metrics (`durationMs`, `testCasesCount`, `passedTestCases`).
  4. Error classifications and sanitized stack traces (without code snippets).
