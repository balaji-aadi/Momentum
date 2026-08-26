# Sarthi Judge Engine — Phase 12 Master Architecture & Evolution Plan
## Security, Reliability & Observability Framework

---

## 1. Executive Summary & Evolution Context

### 1.1 Long-Term Evolution Roadmap
The **Sarthi Judge Engine** follows a strict, multi-phase production evolution model:

```
Phase 1–10 (Frozen Judge Core)
  ├── Drivers, Comparators, Serializers, Process Runners, Security Regex
  └── Baseline Execution Engine & Output Evaluation
        │
Phase 11 (Frozen Execution Orchestration)
  ├── Transport-Independent CoreJudgeExecutor
  ├── ExecutionJob Domain Model & JobStateMachine
  ├── Dual-Tier IdempotencyGuard & RetryEngine
  ├── Memory & Redis ExecutionQueue Adapters
  ├── JudgeWorker Pool & JudgeGatewayService
  └── Feature-Flagged Controller Migration (JUDGE_ASYNC_ORCHESTRATION_ENABLED)
        │
Phase 12 (Current Focus — Security, Reliability & Observability)
  ├── Tier-2 Hardened Container Sandbox (Docker/Podman OCI Isolation)
  ├── Dual-Mount Ephemeral Workspace Architecture (/workspace exec vs /tmp noexec)
  ├── Fenced Job Lease Ownership Tokens & Worker Crash Recovery
  ├── Worker Liveness, Readiness & Execution Capacity Probes
  ├── Secure Internal Prometheus Observability Telemetry (Zero worker_id cardinality)
  └── Structured Context JSON Logging & Privacy Protections
        │
Phase 13 (Future — Horizontal Scaling & Capacity)
  └── Multi-Region Worker Clustering, Dynamic Capacity Auto-Scaling, Rate-Limiting
        │
Phase 14 (Future — Advanced Optimization & Hardening)
  └── gVisor/nsjail Sandbox Optimization, Warm Container Pools, Zero-Copy I/O
```

---

## 2. Phase 12 High-Level Objectives & Necessity

### 2.1 Why Phase 12 is Required After Phase 11
Phase 11 successfully extracted execution from HTTP request threads into asynchronous queue workers (`JudgeGatewayService` ➔ `IExecutionQueue` ➔ `JudgeWorker` ➔ `CoreJudgeExecutor`). However, Phase 11 executes code via host-level child processes (`HostSubprocessSandboxDriver` — Tier 1).

In a multi-tenant production environment, executing untrusted code at the host process level carries unacceptable risks:
1. **Security Vulnerability**: Host subprocesses share kernel interfaces, filesystem trees, and process namespaces with the host operating system.
2. **Reliability Gap**: If a worker process dies mid-execution, jobs claimed by that worker remain orphaned in `CLAIMED` / `RUNNING` state without fenced lease ownership validation.
3. **Observability Deficit**: Absence of standardized JSON correlation logging and Prometheus metrics prevents real-time monitoring of queue depth, execution duration p95/p99, worker capacity, and security violations.

Phase 12 solves these three core production requirements.

---

## 3. Scope, Dependencies & Non-Goals

### 3.1 Dependencies on Phase 11
Phase 12 builds strictly on top of Phase 11 without mutating its frozen interfaces:
- **`CoreJudgeExecutor`**: Transport-independent execution core (reused unchanged).
- **`ExecutionJob` & `JobStateMachine`**: Extended with lease metadata (`leaseId`, `leaseExpiresAt`) while preserving all state transitions.
- **`IExecutionQueue` & `RedisExecutionQueue`**: Job persistence and queue driver (reused unchanged).
- **`ISandboxDriver`**: Abstract sandbox driver interface implemented by `DockerContainerSandboxDriver`.

### 3.2 Phase 12 Scope
1. **Tier-2 Container Sandbox (`DockerContainerSandboxDriver`)**: OCI container runtime isolation using pinned image digests, `--network none`, `--read-only` root filesystem, dual-mount ephemeral volumes (`/workspace` `exec` for code execution vs `/tmp` `noexec` for temp files), unprivileged UID/GID (`1000:1000`), `--pids-limit 64`, resource quotas (`--cpus 1.5`, `--memory 512m`), and runtime-tailored `seccomp-bpf` syscall profiles.
2. **Fenced Job Lease Engine (`WorkerLeaseManager`)**: Fenced job leases (`leaseId` ownership token), automatic lease renewal, and lease expiration reclaiming to prevent duplicate execution during worker stalls/partitioning.
3. **Tri-State Worker Health Framework**: Explicit separation of worker **Liveness**, **Readiness**, and **Execution Capacity**.
4. **Structured JSON Logging & Privacy Protection (`JudgeLogger`)**: Request correlation propagation (`correlationId`, `traceId`, `jobId`) with strict redaction of student source code and credentials.
5. **Secured Prometheus Metrics (`JudgeMetricsCollector`)**: Exposing internal `/api/v1/judge/metrics` with low-cardinality metric labels (strictly excluding `worker_id` to accommodate Phase 13 auto-scaling).

### 3.3 Non-Goals
- **Do NOT alter Phase 1–10 Judge Core logic**: Driver generators, comparators, and serializers remain frozen.
- **Do NOT implement Kubernetes / gVisor (Phase 14 Scope)**: Container isolation is standardized on Docker/Podman OCI containers.
- **Do NOT implement horizontal auto-scaling (Phase 13 Scope)**: Dynamic worker scaling based on queue depth belongs to Phase 13.

---

## 4. Architectural Boundaries & Models

```
[ HTTP Client / Gateway API ]
           │ (x-correlation-id, x-trace-id)
           ▼
 [ JudgeGatewayService ] ──► [ IdempotencyGuard ]
           │ (Attaches correlationId, traceId)
           ▼
  [ IExecutionQueue ] (Redis / Memory)
           │
  ┌─────────────────────────────────────┐
  │ Fenced Job Lease Ownership & Reclaim│
  └────────────────┬────────────────────┘
                   ▼
    [ JudgeWorker ] ◄──► [ WorkerLivenessMonitor / LeaseManager ]
           │ (Verifies leaseId token, emits metrics & structured logs)
           ▼
  [ CoreJudgeExecutor ]
           │
           ▼
[ DockerContainerSandboxDriver ] (Tier-2 Container Sandbox)
  ├── --network none
  ├── --read-only /
  ├── --tmpfs /workspace:rw,exec,nosuid,size=64m  (Execution Workspace)
  ├── --tmpfs /tmp:rw,noexec,nosuid,size=16m      (System Temp - No Exec)
  ├── --user 1000:1000
  ├── --pids-limit 64
  └── --security-opt seccomp=profile.json
```

---

## 5. Security, Reliability & Observability Models

### 5.1 Security Model (Tier 2 Container Sandbox)
- **Host / Container Boundary**: Student code executes inside an ephemeral container. Host filesystem root `/` is unmounted/isolated; container root is mounted `--read-only`.
- **Dual-Mount Ephemeral Workspace Policy**:
  - `/workspace`: Mounted as `tmpfs` `rw,exec,nosuid,size=64m`. Holds driver harness source, compiled `.o`/`.class` binaries, and executable output.
  - `/tmp`: Mounted as `tmpfs` `rw,noexec,nosuid,size=16m`. System temporary directory strictly blocks execution of dropped binaries (`noexec`).
  - *Tradeoff Rationale*: Isolating executable binary generation to `/workspace` while enforcing `noexec` on `/tmp` prevents malicious scripts from dropping hidden executables into system temp space while guaranteeing 100% compatibility for compiled C++/Java binaries and interpreted Python/Node harnesses.
- **Process Isolation**: Containers run with `--user 1000:1000`, `--cap-drop=ALL`, `--security-opt no-new-privileges:true`.
- **Resource Limits**: `--cpus 1.5`, `--memory 512m`, `--memory-swap 512m`, `--pids-limit 64`.
- **Network Isolation**: `--network none` (zero network interfaces except loopback `lo`).

### 5.2 Reliability Model (Fenced Job Lease Ownership)
- **Lease Ownership Token**: Every claimed job receives a unique UUIDv4 `leaseId` and `leaseExpiresAt` (e.g. 30s TTL).
- **Lease Renewal**: Active worker periodically extends `leaseExpiresAt` while processing.
- **Fencing Protection**: If a worker stalls or suffers a network partition, the lease expires. A secondary worker reclaims the job. If the stalled worker attempts to complete the job later, its `leaseId` token is rejected by state-transition fencing in `JobStateMachine`, preventing duplicate completion.

### 5.3 Observability Model (Metrics & Structured Context Logging)
- **Correlation Propagation**: `x-correlation-id` and `x-trace-id` headers flow from HTTP request ➔ Gateway ➔ Job ➔ Worker ➔ Sandbox ➔ Logger.
- **Privacy Protections**: Source code, secrets (`MONGO_URI`, `JWT_SECRET`), and full raw testcase payloads are strictly excluded from logs.
- **Metrics Security & Low Cardinality**: Metrics endpoint `/api/v1/judge/metrics` is bound to internal admin port / protected route. High-cardinality fields (`jobId`, `userId`, `code`, and `worker_id`) are strictly excluded as Prometheus metric labels to support Phase 13 dynamic auto-scaling without monitoring memory explosion.

---

## 6. Migration, Rollback & Acceptance Criteria

### 6.1 Migration Strategy
- Feature flag: `JUDGE_TIER2_SANDBOX_ENABLED=true/false` (default `false` for local dev).
- Strict mode flag: `JUDGE_STRICT_SANDBOX_REQUIRED=true/false`.
- Zero-downtime deployment: Workers attempt container driver execution when enabled; fall back gracefully to Tier 1 host subprocess when `JUDGE_STRICT_SANDBOX_REQUIRED=false`.

### 6.2 Rollback Strategy
- Setting `JUDGE_TIER2_SANDBOX_ENABLED=false` instantly reverts worker sandbox driver selection to Tier 1 `HostSubprocessSandboxDriver` without restarting database or HTTP services.

### 6.3 Acceptance Criteria
1. **Tier-2 Sandbox Isolation Tests**:
   - Network socket creation inside container throws `PermissionDenied` / `ENETUNREACH`.
   - Filesystem write attempts to `/usr` or `/root` throw `Read-only filesystem` error.
   - Code execution in `/workspace` succeeds; binary execution attempts dropped in `/tmp` fail with `Permission denied` (`noexec`).
   - Fork bomb (`:(){ :|:& };:`) blocked cleanly by `--pids-limit 64`.
   - Syscall tampering (`ptrace`, `unshare`) blocked by seccomp policy.
2. **Fenced Job Lease Tests**:
   - Terminating worker thread mid-job triggers `WorkerLivenessMonitor` recovery within 15s.
   - Stalled worker attempt to commit job post-expiration is rejected by `leaseId` fencing token check.
3. **Observability Tests**:
   - Structured JSON logs emitted with valid `correlationId` and `jobId`.
   - GET `/api/v1/judge/metrics` returns Prometheus format string with aggregate metrics and zero `worker_id` label pollution.
4. **Zero-Regression Test Pass**:
   - All 115 existing automated unit and validation tests pass 100%.
