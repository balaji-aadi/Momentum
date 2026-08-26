# Sarthi Judge Engine — Phase 11 Architecture Review & Technical Specification

- **Document Version**: 3.0.0 (Final Pre-Implementation Architecture Review)
- **Status**: FINAL REVISION / PENDING IMPLEMENTATION APPROVAL GATE
- **Author**: Core Engineering Team & System Architecture Reviewer

---

## 1. Executive Summary

This document presents the **final pre-implementation architectural review** for **Phase 11: Execution Orchestration**. It addresses all seven critical design requirements: **Sandbox Security Taxonomy**, **Phase 8/9 Decoupling via `CoreJudgeExecutor`**, **Idempotency Architecture**, **Job Payload & Transport Optimization**, **4-Tier SLO Matrix**, **Revised Production Roadmap**, and the formal **PHASE 11 IMPLEMENTATION GATE**.

---

## 2. Deep-Dive Architectural Resolutions

### Issue 1: Sandbox & Security Boundary Taxonomy
We establish a 3-tier isolation taxonomy to separate minimum production requirements from container hardening and microVM virtualization:

```text
Tier 1: Minimum Production Isolation (Phase 11 Baseline)
  ├── Unprivileged non-root user (sarthi-runner, UID 10001)
  ├── Ephemeral isolated working directory (tmpfs / chmod 700)
  ├── Process & memory limits (ulimit & cgroups v2 caps)
  ├── Static AST & Regex token sanitization (securitySanitizer.js)
  └── Process watchdog timer (SIGTERM -> SIGKILL after 250ms)

Tier 2: Hardened Container Isolation (Phase 12 Security Hardening)
  ├── Ephemeral Container per Job (Docker / Podman / nsjail driver)
  ├── Network namespace isolation (--network none)
  ├── Read-only root filesystem (--read-only) with ephemeral tmpfs
  └── System call filtering (seccomp-bpf dropping dangerous syscalls)

Tier 3: Hypervisor Isolation & Sandbox Pre-Warming (Phase 14 Optimization)
  ├── MicroVM virtualization (gVisor runsc / Firecracker)
  └── Pre-warmed container pool for sub-10ms container startup
```

**Roadmap Boundary Revision**:
- **Phase 11 (Execution Orchestration)**: Introduces abstract `ISandboxDriver` interface and implements `HostSubprocessSandboxDriver` with Tier 1 Minimum Production Isolation.
- **Phase 12 (Reliability, Observability & Security Hardening)**: Introduces `ContainerSandboxDriver` (Tier 2 Container Isolation) as the mandatory sandbox driver for production worker nodes.

---

### Issue 2: Phase 8/9 Extraction — Transport-Independent Execution Service
- **Refactoring Rationale**: Existing `RunCodeService` and `SubmitCodeService` in `backend/services/judge-service/` are HTTP-oriented services. `SubmitCodeService` directly creates MongoDB `Submission` documents (`Submission.create(...)`), which would cause double-persistence bugs if invoked directly by a background `JudgeWorker`.
- **Architectural Solution**:
  - We extract a pure, transport-independent **`CoreJudgeExecutor`** (`backend/services/judge/executor/CoreJudgeExecutor.js`).
  - `CoreJudgeExecutor` accepts a transport-agnostic contract:
    ```javascript
    {
      problemPackage,      // Resolved Problem Schema / Immutable Package
      language,            // 'python' | 'javascript' | 'cpp' | 'java'
      code,                // Student source code string
      testCases,           // Array of { input, expectedOutput }
      executionProfile,    // { timeLimitMs, memoryLimitMb, comparator }
      functionDefinition   // { name, parameters, returnType }
    }
    ```
  - `CoreJudgeExecutor` executes the frozen Phase 1–10 pipeline in memory:
    `DriverGeneratorService` ➔ `ISandboxDriver.execute()` ➔ Parse Sentinel Output ➔ `ComparatorRegistry.compare()` ➔ Return Pure `ExecutionVerdict`.
  - **Zero Database Side-Effects**: `CoreJudgeExecutor` does not touch MongoDB or Redis.
  - `RunCodeService` and `SubmitCodeService` are refactored to be thin HTTP wrappers delegating execution to `CoreJudgeExecutor`. `JudgeWorker` calls `CoreJudgeExecutor` directly.

---

### Issue 3: Idempotency Architecture
We explicitly distinguish the 5 execution scenarios:

1. **HTTP / Network Retry of Same Request**: Client sends standard `Idempotency-Key` header (UUIDv4 per UI click). Gateway caches `Idempotency-Key ➔ jobId` in Redis/Memory (TTL 60s). Network retries instantly receive existing `jobId`.
2. **Duplicate RUN Request**: If no header is sent, Gateway computes `runDeduplicationKey = sha256(userId + problemId + language + code + 'RUN' + packageHash)`. Checked against a **5-second sliding window**. Identical RUN requests within 5 seconds return active `jobId`; after 5 seconds, a new test job is created.
3. **Genuinely New RUN**: Generated `Idempotency-Key` is new, or 5-second window expired -> Creates new `ExecutionJob` (`executionType: 'RUN'`), non-persisted result (TTL 1 hour), no DB record.
4. **Duplicate SUBMIT Request**: Client includes `Idempotency-Key` header. Gateway also checks `submitDeduplicationKey = sha256(userId + problemId + language + code + 'SUBMIT' + packageHash)` against a **10-second window** to prevent duplicate `Submission` documents in MongoDB.
5. **Genuinely New SUBMIT**: Creates new `Submission` record in MongoDB (status: `QUEUED`), creates new `ExecutionJob` (`executionType: 'SUBMIT'`), enqueues to high-priority queue.

*Context Preservation*: All deduplication keys incorporate `packageHash`. Recompiling a problem invalidates cached idempotency keys.

---

### Issue 4: Job Payload Evaluation — Inline vs. Reference

| Criteria | Inline Code Payload (`ExecutionJob.code`) | Reference Payload (`submissionId` only) |
| :--- | :--- | :--- |
| **Worker Dequeue Overhead** | **$0\text{ ms}$ DB Read Latency**. Immediate execution. | **$+15\text{ to }50\text{ ms}$ DB read round-trip**. |
| **DB Dependency** | **Zero DB read dependency** during worker execution. | Hard dependency on MongoDB read pool availability. |
| **RUN Request Support** | **Native**. Supports transient test runs cleanly. | Incompatible (forces transient DB writes). |
| **Queue Memory Impact** | $\sim 5\text{ MB}$ queue memory at 1,000 queued jobs ($< 64\text{ KB}$ cap). | $\sim 200\text{ bytes}$ per job payload. |

**Approved Recommendation**: **Inline Source Code Payload** with strict $64\text{ KB}$ envelope size cap enforced at Gateway validation. For `SUBMIT` jobs, the job payload carries both `submissionId` (for DB verdict updates) and inline `code` (for execution).

---

### Issue 5: Latency & 4-Tier SLO Matrix

We replace the hard $< 50\text{ ms}$ total execution requirement with a 4-tier SLO matrix:

1. **API Acknowledgement SLO (Gateway Response)**: **p95 $< 30\text{ ms}$**, **p99 $< 100\text{ ms}$** (`HTTP 202 Accepted` with `jobId`).
2. **Queue Wait Time SLO (Enqueue to Claim)**: **p95 $< 200\text{ ms}$** (normal load); **p95 $< 3000\text{ ms}$** (peak bursts).
3. **Execution & Evaluation SLO**: Bounded by `problem.executionLimits.timeLimitMs` + harness overhead (~50ms) + compilation (~500-1500ms for C++/Java).
4. **End-to-End Completion SLO (Submit to Verdict)**: **p95 $< 2.5\text{s}$** (Python/JS RUN); **p95 $< 5.0\text{s}$** (C++/Java SUBMIT).

---

## 3. Revised Production Roadmap

```text
Phase 11 ──> Execution Orchestration (Jobs, Queue Abstraction, Gateway, Workers, CoreJudgeExecutor, Tier-1 Sandbox)
Phase 12 ──> Reliability, Observability & Security Hardening (Tier-2 Container Sandbox, Tracing, Metrics, Heartbeats)
Phase 13 ──> Horizontal Scaling & Capacity Management (Multi-Worker Pods, Rate Limits, Capacity Scheduling)
Phase 14 ──> Advanced Production Optimization (Tier-3 Hypervisor/gVisor, Warm VM Pools, Package Caching)
```

---

## 4. PHASE 11 IMPLEMENTATION GATE

### 4.1 Decisions Already Frozen (Phases 1–10)
- ProblemPackage schema, SHA-256 signatures, Mulberry32 PRNG seed generation.
- `InputParserRegistry`, `OutputSerializerRegistry`, `OutputNormalizers`.
- `ComparatorRegistry` (ExactMatch, UnorderedArrayMatch, FloatToleranceMatch, CustomComparator).
- `DriverGeneratorService` and 4 language driver templates (Python, C++, Java, JS).
- `RuntimeProcessExecutor` execution result payload schema.
- `VerdictEngine` verdict classification constants (`ACCEPTED`, `WRONG_ANSWER`, `TLE`, `MLE`, `COMPILE_ERROR`, `RUNTIME_ERROR`).

### 4.2 Decisions Requiring Approval
- Extraction of `CoreJudgeExecutor.js` as the transport-independent execution engine.
- Gateway `HTTP 202 Accepted` response contract (`{ jobId, state: "QUEUED", statusUrl }`).
- Dual-tier idempotency model (`Idempotency-Key` header + 5-second double-click window fallback).
- Inline source code payload transport with $64\text{ KB}$ envelope cap.
- 4-Tier SLO matrix specification.
- Tier-1 Process Isolation for Phase 11 dev; Tier-2 Container Sandbox for Phase 12 prod.

### 4.3 Files / Modules That Will Change (Refactored)
- `backend/services/judge-service/runCode.service.js` (Delegates execution to `CoreJudgeExecutor`).
- `backend/services/judge-service/submitCode.service.js` (Delegates execution to `CoreJudgeExecutor`).
- `backend/services/judge-service/judge.controller.js` (Invokes `JudgeGatewayService` and returns `202 Accepted`).
- `backend/routes/judge.router.js` (Adds GET `/jobs/:jobId` polling route).

### 4.4 Files / Modules That MUST Remain Unchanged (Frozen)
- `backend/services/judge/driverGenerator/` (Python, C++, Java, JS Driver Generators).
- `backend/services/judge/comparators/` (ComparatorRegistry and all comparators).
- `backend/services/judge/inputParsers/` & `outputSerializers/`.
- `backend/services/judge/runners/RuntimeProcessExecutor.js`.
- `backend/services/judge/securitySanitizer.js`.
- `backend/services/judge/v2/packages/ProblemPackage.js`.

### 4.5 New Modules To Be Created (Phase 11 Scope)
- `backend/services/judge/executor/CoreJudgeExecutor.js`
- `backend/services/judge/orchestration/JudgeGatewayService.js`
- `backend/services/judge/orchestration/ExecutionJob.js`
- `backend/services/judge/orchestration/JobStateMachine.js`
- `backend/services/judge/orchestration/IdempotencyGuard.js`
- `backend/services/judge/orchestration/RetryEngine.js`
- `backend/services/judge/orchestration/JudgeWorker.js`
- `backend/services/judge/orchestration/sandbox/HostSubprocessSandboxDriver.js`
- `backend/services/judge/orchestration/queues/IExecutionQueue.js`
- `backend/services/judge/orchestration/queues/MemoryExecutionQueue.js`
- `backend/services/judge/orchestration/queues/RedisExecutionQueue.js`

### 4.6 Migration Strategy
- Zero-downtime feature-flagged migration (`JUDGE_ASYNC_ORCHESTRATION_ENABLED=true/false`).
- When `false`, controllers retain synchronous fallback.
- When `true`, controllers delegate to `JudgeGatewayService`.

### 4.7 Rollback Strategy
- Setting `JUDGE_ASYNC_ORCHESTRATION_ENABLED=false` in environment variables instantly reverts system to synchronous execution without code changes or downtime.

### 4.8 Acceptance Criteria
- 100% pass rate on all 39 existing unit/integration tests in `backend/tests/`.
- Gateway `/api/v1/judge/run` and `/submit` return `202 Accepted` in $< 30\text{ ms}$ p95.
- `MemoryExecutionQueue` and `RedisExecutionQueue` pass complete job state lifecycle tests.
- Retries on `Idempotency-Key` return existing `jobId`.
- Double-clicks within 5 seconds return active `jobId`.
- Infrastructure process crashes are retried up to 3 times before `INFRA_ERROR`.

### 4.9 Security Assumptions
- Phase 11 enforces Tier 1 Minimum Production Isolation (`sarthi-runner` user, `ulimit`, `cgroups v2`, `securitySanitizer`, hard timeout).
- Phase 12 mandates Tier 2 Container Isolation (`DockerSandboxDriver` with `--network none` and `--read-only`).

### 4.10 Known Architectural Risks
- Host process execution in Phase 11 requires host OS configuration (`ulimit`/`cgroups`).
- Redis memory growth under heavy load if job TTLs are set too high (mitigated by 1-hour TTL cap).
