# Sarthi Judge Engine — Phase 14 Concrete Implementation Plan
## Advanced Sandbox Optimization, Warm Pools & Micro-Kernel Hardening

---

## 1. Governance & Execution Order

Phase 14 is implemented in 8 controlled, sequential sub-stages:

```
Stage 14.0 — Profiling Infrastructure (ExecutionStageProfiler & ProfilingCoreJudgeExecutor Wrapper)
       ↓
Stage 14.1 — Baseline Measurement (500-Job Workload Stage Profiling)
       ↓
Stage 14.2 — CompilationArtifactCache (Single-Flight Lock, Cache Schema Versioning & Identity)
       ↓
Stage 14.3 — WarmContainerPool (Baseline Process Tree Sanitization & Destruction Gate)
       ↓
Stage 14.4 — gVisorSandboxDriver (Native OCI Pre-Warming & Strict Gate)
       ↓
Stage 14.5 — System Control Loop Integration
       ↓
Stage 14.6 — Incremental & Performance Comparison Benchmarking
       ↓
Stage 14.7 — Security & Full 163-Test Regression Validation
```

---

## 2. Sub-Stage Specifications & Mandatory Corrections

### Stage 14.0 — Profiling Infrastructure (`ExecutionStageProfiler` & Decorator Wrapper)
**Modules**:
- `backend/services/judge/observability/ExecutionStageProfiler.js`
- `backend/services/judge/executor/ProfilingCoreJudgeExecutor.js` (Decorator Wrapper)

- **Frozen Core Protection**: `CoreJudgeExecutor.js` remains 100% **FROZEN**. Profiling instrumentation is implemented via `ProfilingCoreJudgeExecutor`, a zero-side-effect wrapper decorator that wraps `CoreJudgeExecutor.execute(job)` without altering its execution logic or API contract.
- **Instrumentation Points**: 11 discrete execution stages:
  `GatewayIngestion`, `RateLimitingCheck`, `BackpressureEvaluation`, `QueueEnqueue`, `FairShareDequeue`, `WorkerLeaseAcquisition`, `ContainerStartup`, `WorkspaceSetup`, `Compilation`, `ProgramExecution`, `OutputCleanup`.
- **Timing API**: `process.hrtime.bigint()` nanosecond precision.
- **Context Attachment**: Timings stored on `job.profilingData = { stages: {}, totalMs: number }`.
- **Telemetry Export**: Aggregated in `JudgeMetricsCollector` using low-cardinality summary metrics (`sarthi_judge_stage_duration_seconds{stage="container_startup"}`).

---

### Stage 14.1 — Baseline Measurement
- Re-runs the identical Phase 13 500-request multi-tenant stress workload with `ProfilingCoreJudgeExecutor` active.
- Establishes empirical baseline percentages for container startup, workspace setup, compilation, program execution, and cleanup.
- *Rule*: Effectiveness of `WarmContainerPool` and `CompilationArtifactCache` cannot be claimed until this empirical baseline is recorded.

---

### Stage 14.2 — `CompilationArtifactCache` Architecture
**Module**: `backend/services/judge/orchestration/capacity/CompilationArtifactCache.js`

- **Immutable Identity Key with Schema Versioning**:
  $$\text{CacheKey} = \text{sha256}\Big(\text{schemaVer (v1)} \parallel \text{code} \parallel \text{harnessVer} \parallel \text{pkgVer} \parallel \text{compilerVer} \parallel \text{compilerFlags} \parallel \text{runtimeVer} \parallel \text{archABI}\Big)$$
- **Policy Compliance Gate**: `schemaVer` (e.g. `v1`) and security policy hash ensure cached artifacts cannot bypass current compiler/runtime/security policies. Updating security flags invalidates older cached entries automatically.
- **Single-Flight Concurrent Lock**: Prevents duplicate parallel compilation of the same artifact by multiple workers. Worker 1 acquires lock `compile:lock:<hash>`; Worker 2 waits on `compile:wait:<hash>` until Worker 1 writes cache.
- **Checksum & Corruption**: Stores `.o` / `.class` binary with `sha256` checksum metadata. If checksum mismatch occurs on retrieval, entry is evicted and falls back to fresh compilation.
- **Limits & Eviction**: 500 MB local disk LRU storage, 24-hour TTL expiry.

---

### Stage 14.3 — `WarmContainerPool` Architecture & Baseline Process Sanitization
**Module**: `backend/services/judge/orchestration/sandbox/WarmContainerPool.js`

- **Corrected Lifecycle Sequence**:
  `WARM` ➔ `LEASED` ➔ `RUNNING` ➔ `SANITIZATION` ➔ `HEALTH_CHECK` ➔ `WARM` or `DESTROY`
- **Native OCI Runtime Spawning**: Warm containers are created directly under the selected OCI runtime (`runsc` when gVisor is enabled, or standard OCI when gVisor is disabled). Zero attempting to retrofit gVisor onto existing standard containers.
- **Baseline Process Tree Sanitization**:
  1. Ephemeral `/workspace` and `/tmp` `tmpfs` volumes unmounted and formatted.
  2. **Baseline Process Audit**: Inspects container process tree against an expected baseline process set (PID 1 entrypoint / runtime supervisor). Any process **outside** the expected baseline process set (e.g. orphaned student sub-processes, fork bombs, background daemons) is classified as process contamination.
  3. Residual file audit: Any lingering root files trigger immediate **DESTRUCTION**.
  4. Health Gate: Process contamination or sanitization failure transitions container to `DESTROY` (`NEVER_RETURN_TO_POOL`) and spawns a fresh replacement under the native runtime.
- **Dynamic Sizing**: Target warm container count = `ceil(TOTAL_EXECUTION_SLOTS * 0.30)`.

---

### Stage 14.4 — `gVisorSandboxDriver` Architecture
**Module**: `backend/services/judge/orchestration/sandbox/gVisorSandboxDriver.js`

- **Implementation**: Implements `ISandboxDriver` interface using Docker `runsc` (Google gVisor user-space kernel).
- **Strict Gate & Zero Downgrade**:
  - Flags: `JUDGE_GVISOR_ENABLED=true/false`, `JUDGE_STRICT_GVISOR_REQUIRED=true/false`.
  - If `JUDGE_STRICT_GVISOR_REQUIRED=true` and `runsc` is absent/unreachable, returns `SANDBOX_UNAVAILABLE`. Zero fallback to standard Docker or host subprocess.

---

### Stage 14.5 — System Control Loop Integration

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
gVisorSandboxDriver.execute() / ProfilingCoreJudgeExecutor Wrapper
   ├── Requests pre-warmed container from WarmContainerPool (spawner under native runtime)
   ├── Checks sha256 checksum in CompilationArtifactCache (with schema v1 check)
   └── Executes code inside gVisor runsc user-space sandbox
         │
         ▼
WarmContainerPool Sanitization / Destruction Gate (Process tree audit)
         │
         ▼
WorkerLeaseManager.ack(jobId)                 <-- Lease Released
```

---

### Stage 14.6 — Independent Feature Flags & Incremental Performance Benchmarking

Phase 14 features are independently flag-controlled to enable isolated measurement of each component:

```env
# Phase 14 Independent Feature Flags
JUDGE_PROFILING_ENABLED=true          # Enables Stage 14.0 Profiling Decorator
JUDGE_COMPILATION_CACHE_ENABLED=true  # Enables Stage 14.2 Artifact Cache
JUDGE_WARM_POOLS_ENABLED=true         # Enables Stage 14.3 Warm Container Pool
JUDGE_GVISOR_ENABLED=true             # Enables Stage 14.4 gVisor runsc Sandbox
JUDGE_STRICT_GVISOR_REQUIRED=false    # Enforces Zero-Downgrade Security Gate
```

#### Incremental Benchmarking Protocol
1. **Baseline**: `JUDGE_PROFILING_ENABLED=true` (All optimizations `false`).
2. **Cache Only**: `JUDGE_COMPILATION_CACHE_ENABLED=true` (Warm pools `false`).
3. **Warm Pools Only**: `JUDGE_WARM_POOLS_ENABLED=true` (Cache `false`).
4. **gVisor Only**: `JUDGE_GVISOR_ENABLED=true`.
5. **Full Stack**: All flags `true`.

---

### Stage 14.7 — Security & Full 163-Test Regression Validation
- Runs complete test suite:
  - `phase14_optimization_profiling.test.js`
  - Phase 8 (16/16), Phase 9 (21/21), Phase 10 (22/22), Phase 11 (31/31), Phase 11 Full (25/25), Phase 12 (19/19), Phase 13 (23/23), Phase 13 Full (6/6).
  - Confirms **163 / 163** tests pass 100%.

---

## 3. Exact File-Level Specification

| File Path | Status | Responsibilities & Governance |
| :--- | :--- | :--- |
| `backend/services/judge/observability/ExecutionStageProfiler.js` | **NEW** | Nanosecond stage profiling (11 stages). Non-blocking attachment to job context. |
| `backend/services/judge/executor/ProfilingCoreJudgeExecutor.js` | **NEW** | Zero-side-effect profiling decorator wrapping frozen `CoreJudgeExecutor.js`. |
| `backend/services/judge/orchestration/capacity/CompilationArtifactCache.js` | **NEW** | Immutable sha256 cache identity with `schemaVer (v1)`, single-flight lock, 500 MB LRU, 24h TTL, checksum verification. |
| `backend/services/judge/orchestration/sandbox/WarmContainerPool.js` | **NEW** | Pre-warmed container pool manager spawning under native runtime with process tree baseline audit and destruction gate. |
| `backend/services/judge/orchestration/sandbox/gVisorSandboxDriver.js` | **NEW** | Sub-kernel `runsc` virtualization driver with strict security gate (`SANDBOX_UNAVAILABLE`). |
| `backend/tests/phase14_optimization_profiling.test.js` | **NEW** | Phase 14 automated test suite covering profiler, cache, warm pool, gVisor, and regression. |
| `backend/services/judge/sandbox/SandboxOrchestrator.js` | **MODIFY** | Integrates `gVisorSandboxDriver` and `WarmContainerPool` selection. |
| **`CoreJudgeExecutor.js`** | **FROZEN** | **DO NOT TOUCH**. Preserved untouched; wrapped by `ProfilingCoreJudgeExecutor.js`. |
| **Phases 1–13 Baseline Modules** | **FROZEN** | **DO NOT TOUCH**. All Phase 1–13 core runners, queues, schedulers, rate limiters, and lease managers remain 100% frozen. |

---

## 4. Explicit Phase 14 Non-Goals

1. Multi-region edge-worker cluster synchronization (reserved for future platform expansion).
2. Bare-metal Firecracker micro-VM infrastructure (reserved for future platform expansion).
3. Modifying frozen Phase 1–13 contracts or interfaces.
