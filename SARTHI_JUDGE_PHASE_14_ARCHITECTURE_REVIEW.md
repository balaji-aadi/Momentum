# Sarthi Judge Engine — Phase 14 Architecture Review & Deep Dive
## Technical Resolutions for Stage Profiling, Warm Pools, Compilation Cache & gVisor

---

## 1. Component Classification Matrix

Each Phase 14 component is explicitly classified as **APPROVED**, **CONDITIONAL**, or **DEFERRED / REJECTED**:

| Component Name | Technical Classification | Governance Rationale |
| :--- | :--- | :--- |
| **`ExecutionStageProfiler`** | **APPROVED** | Mandatory Gate 1. Measures 11 execution stages with nanosecond precision to guide optimization empirically. |
| **`CompilationArtifactCache`** | **APPROVED** | Immutable sha256 identity, checksum verification, 500 MB LRU cap, 24h TTL, and complete tenant isolation. |
| **`gVisorSandboxDriver`** | **APPROVED** | Sub-kernel virtualization using `runsc`. Enforces strict security mode with zero silent fallback. |
| **`WarmContainerPool`** | **APPROVED (CONDITIONAL)** | Conditional on 4-step sanitization lifecycle (`WARM` ➔ `LEASED` ➔ `RUNNING` ➔ `SANITIZATION` ➔ `HEALTH_CHECK` ➔ `WARM` or `DESTROY`). |
| **Zero-Copy Stream Piping** | **CONDITIONAL / DEFERRED** | Deferred pending empirical evidence from `ExecutionStageProfiler`. Implemented only if stdout piping latency $> 5\%$. |

---

## 2. Technical Deep Dive & Architectural Resolutions

### 2.1 Challenge 1: `ExecutionStageProfiler` Instrumentation & Accuracy
- **High-Resolution Instrumentation**: Uses `process.hrtime.bigint()` nanosecond timestamps.
- **Zero Async Overhead**: Non-blocking in-memory timer measurements ($1\text{ ms} = 1,000,000\text{ ns}$).
- **Measured Stages**:
  1. `Gateway Ingestion`
  2. `Rate Limiting Check`
  3. `Backpressure Evaluation`
  4. `Queue Enqueue & Tenant Ring`
  5. `FairShare Dequeue & Lock`
  6. `Worker Lease Acquisition`
  7. `Container Startup & Handshake`
  8. `Workspace Setup`
  9. `Compilation (C++/Java)`
  10. `Program Execution`
  11. `Output Piping & Cleanup`

---

### 2.2 Challenge 2: `WarmContainerPool` Lifecycle, Sanitization & Contamination Prevention

#### Complete State Lifecycle
```
   [ WARM ]  ──► (Job Dispatch) ──► [ LEASED ]
      ▲                                │
      │ (Health Check Passed)          ▼
[ SANITIZATION ] ◄── (Job Done) ─── [ RUNNING ]
      │
      ├── (Sanitization / Health Failed) ──► [ DESTROY ] ──► (Never Returned)
```

#### Sanitization & Contamination Prevention Directives
Upon job completion, containers undergo a mandatory 4-step sanitization protocol before returning to `WARM` state:
1. **Filesystem Scrub**: Ephemeral `/workspace` and `/tmp` `tmpfs` volumes are completely formatted and re-mounted.
2. **Process Namespace Audit**: Inspects container process tree. If lingering processes exist (`pids > 0`), container is **DESTROYED**.
3. **Residual State Inspection**: Checks root filesystem immutability. Any lingering files trigger immediate container **DESTRUCTION**.
4. **Health Check Gate**: If sanitization fails, container transitions to `DESTROY` and is **NEVER RETURNED TO THE POOL**. A fresh container is spawned to replenish pool capacity.

---

### 2.3 Challenge 3: `WarmContainerPool` + `WorkerAutoScaler` Resource Economics
- **Dynamic Sizing Formula**:
  $$\text{TargetWarmCount} = \left\lceil \text{TOTAL\_EXECUTION\_SLOTS} \times 0.30 \right\rceil$$
- **Resource Protection**: Warm container pool capacity is capped at 30% of total active execution slots ($\sum \text{worker.maxConcurrency}$), preventing idle warm containers from competing for host RAM/CPU with active execution tasks.

---

### 2.4 Challenge 4: `CompilationArtifactCache` Identity & Corruption Protection

#### Immutable Key Construction
To prevent cache poisoning or cross-tenant contamination, cache keys combine all compilation parameters:

$$\text{CacheKey} = \text{sha256}\Big(\text{sourceCode} \parallel \text{driverHarnessVersion} \parallel \text{packageVersion} \parallel \text{compilerIdentityVersion} \parallel \text{compilerFlags} \parallel \text{runtimeVersion} \parallel \text{targetArchABI}\Big)$$

#### Ownership & Tenant Isolation Rules
- Artifact keys include `sha256(sourceCode)`. One student's compilation artifact is **NEVER** reused for another student unless source code and driver harness match $100\%$ identically.
- **Checksum Verification**: On retrieval, cached binary files are verified against an internal sha256 checksum. If verification fails or file is corrupted, cache entry is evicted and execution falls back to fresh compilation.
- **Limits**: 500 MB local LRU capacity with 24-hour TTL expiry.

---

### 2.5 Challenge 5 & 6: `gVisorSandboxDriver` Compatibility & Strict Security Gate

#### Runtime Compatibility
Tested and compatible with Python 3.11, Node.js 20, GCC 13, and OpenJDK 21. `runsc` handles all required runtime syscalls in user space.

#### Strict Security Gate Behavior
- Feature flags: `JUDGE_GVISOR_ENABLED=true/false` and `JUDGE_STRICT_GVISOR_REQUIRED=true/false`.
- If `JUDGE_STRICT_GVISOR_REQUIRED=true` and `runsc` OCI runtime is unavailable on host node:
  - Returns `status: "SANDBOX_UNAVAILABLE"`, `verdict: "SANDBOX_UNAVAILABLE"`.
  - **Zero Silent Security Downgrade**: Falling back to standard Docker or host subprocess execution is strictly prohibited in strict mode.

---

### 2.6 Challenge 7: System Control Loop Integration

The Phase 14 execution flow integrates seamlessly with frozen Phase 11–13 contracts:

```
FairShareScheduler Dequeue
         │
         ▼
WorkerLeaseManager.issueLease(job, workerId)  <-- Phase 12 Authoritative Lease
         │
         ▼
JobStateMachine.transition(job, CLAIMED)       <-- Phase 11 Monotonic State
         │
         ▼
gVisorSandboxDriver.execute()
   ├── Requests container from WarmContainerPool
   ├── Checks CompilationArtifactCache for C++/Java
   └── Executes inside gVisor runsc sandbox
         │
         ▼
WarmContainerPool Sanitization / Destruction
         │
         ▼
WorkerLeaseManager.ack(jobId)                 <-- Lease Released
```

---

### 2.7 Challenge 8: Zero-Copy Stream Optimization Justification
- **Evaluation Status**: **CONDITIONAL / DEFERRED**.
- **Condition**: Will be implemented only if `ExecutionStageProfiler` demonstrates stdout/stderr string allocation consumes $> 5\%$ of total execution time under 500-job stress testing.

---

### 2.8 Challenge 9: Failure Modes, Race Conditions & Recovery Matrix

| Potential Failure Mode | Root Cause | Automated Recovery Policy |
| :--- | :--- | :--- |
| **Cache Poisoning** | Corrupted cached binary file | sha256 checksum verification on retrieval. Evicts entry and triggers fresh compilation on failure. |
| **Stale / Contaminated Container** | Lingering background process | 4-step sanitization & process audit. Destroys container and spawns fresh replacement. |
| **Worker Process Crash** | Host OOM or SIGKILL | Phase 12 `WorkerLeaseManager` reclaims expired lease and re-enqueues job via `RetryEngine`. |
| **gVisor Daemon Failure** | `runsc` process crash | Strict mode returns `SANDBOX_UNAVAILABLE`; non-strict mode falls back to Tier 2 OCI Docker driver. |

---

### 2.9 Challenge 10: Resource Economics Matrix

- **CPU Quota**: Max 1.5 CPUs per active container.
- **Memory Limit**: 512 MB RAM per active container.
- **Warm Pool Memory Cap**: Max 30% of total active execution slots.
- **Compilation Cache Storage Cap**: Max 500 MB local disk LRU cache.
