# Sarthi Judge Engine — Phase 15 Concrete Implementation Plan
## Distributed Scale Infrastructure, Worker Concurrency Benchmarks & DSA Problem Platform

---

## 1. Executive Overview & Governance Order

Phase 15 is implemented in 7 controlled, sequential sub-stages. No Phase 1–14 contracts are modified, `JudgeGatewayService.js` and `CoreJudgeExecutor.js` remain 100% frozen, and no production database schema changes or migrations will be executed during implementation.

```
Stage 15.0 — Worker Concurrency Benchmark Infrastructure & Driver Implementations
       ↓
Stage 15.1 — Redis Cluster Sharding, Hash-Tag Alignment & ClusterSafeFairShareScheduler
       ↓
Stage 15.2 — DatabaseProtectionLayer (Redis Streams, AOF Durability Window & PEL Recovery)
       ↓
Stage 15.3 — DSAProblemPlatform Subsystem (Canonical Problem Contract & Zero Engine Mutations)
       ↓
Stage 15.4 — Progressive Capacity Validation Ladder Infrastructure (1k -> 20k)
       ↓
Stage 15.5 — Phase 15 Composition Adapter Layer & Feature-Flagged Rollback Strategy
       ↓
Stage 15.6 — Security, Database Safety Audit & 179-Test Regression Validation
```

---

## 2. Detailed Sub-Stage Specifications & Mandatory Corrections

### Stage 15.0 — Worker Concurrency Benchmark Infrastructure & Drivers
**Modules**:
- `backend/services/judge/orchestration/scaling/drivers/WorkerThreadsPoolDriver.js`
- `backend/services/judge/orchestration/scaling/drivers/ChildProcessWorkerPoolDriver.js`
- `backend/services/judge/orchestration/scaling/drivers/DistributedWorkerPoolDriver.js`
- `backend/tests/phase15_worker_concurrency_benchmark.js`

- **Responsibilities**: Implements the `IWorkerPoolDriver` interface for Worker Threads, Child Processes, and Distributed Worker Pod abstractions.
- **Benchmark Suite**: Runs identical 500-job workloads across all 4 drivers to empirically evaluate throughput ($T_{\text{jobs}}$), queue wait (p50/p95/p99), CPU saturation, event-loop lag, worker slot utilization, Redis latency, memory footprint, and completion time.
- **Decision Gate**: Benchmark results determine whether Child Processes or Distributed Worker Pods are selected for production deployment.
- **Database Impact**: Zero.
- **Rollback**: Reverts `WorkerAutoScaler` driver selection to `InProcessWorkerPoolDriver`.

---

### Stage 15.1 — Redis Cluster Sharding & `ClusterSafeFairShareScheduler`
**Modules**:
- `backend/services/judge/orchestration/scheduling/ClusterSafeQueueAdapter.js`
- `backend/services/judge/orchestration/scheduling/ClusterSafeFairShareScheduler.js`
- `backend/services/judge/orchestration/queues/DeadLetterQueue.js`

- **Preserving Phase 13 Deterministic Fairness**:
  - `ClusterSafeFairShareScheduler` preserves 100% of Phase 13 scheduling semantics:
    1. Priority Class ordering (`SUBMIT` = `HIGH`, `RUN` = `NORMAL`)
    2. Deterministic tenant ring round-robin interleaving ($A_1 \to B_1 \to C_1$)
    3. FIFO queue age within tenant
    4. Zero duplicate claims across concurrent workers
    5. Single-tenant uncontended 100% burst capacity
    6. Empty tenant queue ring cleanup
- **Redis Cluster Hash Tag Alignment**:
  - Queue Key: `sarthi:queue:{tenantId}:priority`
  - Rate Limit Key: `sarthi:ratelimit:{tenantId}`
  - Lease Key: `sarthi:lease:{jobId}`
- **Dead-Letter Queue (`DeadLetterQueue`)**: Jobs failing max retry attempts transition to `sarthi:queue:dlq:{shardId}`.
- **Database Impact**: Zero.
- **Rollback**: Reverts queue adapter selection to `FairShareQueueAdapter`.

---

### Stage 15.2 — `DatabaseProtectionLayer` (Redis Streams, AOF Semantics & PEL Recovery)
**Module**: `backend/services/judge/orchestration/persistence/DatabaseProtectionLayer.js`

- **AOF Durability Semantics & Crash Window**:
  - `appendfsync=everysec` provides near-real-time persistence with up to a 1-second crash window (up to 1s of unwritten stream data can be lost if host OS kernel crashes before disk AOF flush).
  - A submission result is considered **durable** once written to disk AOF or MongoDB.
- **Pipeline Sequence**:
  1. Worker finishes execution ➔ Appends result to Redis Stream (`sarthi:stream:results`).
  2. Worker acknowledges job processing to `WorkerLeaseManager`.
  3. Consumer group worker reads stream entries in batches of 100 docs and flushes to MongoDB via `bulkWrite` with `upsert: true` on `jobId` (max 20 MongoDB connections).
  4. Consumer calls `XACK` on Redis Stream after MongoDB bulk write completes.
  5. PEL (Pending Entry List) Recovery (`XPENDING` / `XCLAIM`) flushes un-acknowledged stream entries to MongoDB if a consumer worker crashes.
- **Database Impact**: ZERO schema modifications. Idempotent bulk upsert into existing `submissions` collection.
- **Rollback**: Disables async stream persistence (`JUDGE_ASYNC_DB_PERSISTENCE_ENABLED=false`).

---

### Stage 15.3 — `DSAProblemPlatform` Subsystem & Canonical Problem Metadata Contract
**Modules**:
- `backend/services/judge/platform/DSAProblemPlatform.js`
- `backend/services/judge/platform/IDriverHarnessProvider.js`
- `backend/services/judge/platform/templates/` (`cpp_harness.tpl`, `python_harness.tpl`, `java_harness.tpl`, `js_harness.tpl`)

- **Canonical Problem Metadata Contract**:
  ```json
  {
    "problemId": "two-sum",
    "statement": "Given an array of integers...",
    "constraints": "2 <= nums.length <= 10^4",
    "difficulty": "EASY",
    "languageConfig": { "cpp": { "compiler": "gcc13", "flags": "-O2" } },
    "functionSignature": "vector<int> twoSum(vector<int>& nums, int target)",
    "starterCode": "class Solution {\npublic:\n  vector<int> twoSum(...) {}\n};",
    "harnessTemplate": "cpp_harness.tpl",
    "harnessVersion": "v1.0",
    "visibleTestcases": [ { "input": "[2,7,11,15]\n9", "expectedOutput": "[0,1]" } ],
    "hiddenTestcases": [ { "input": "[3,3]\n6", "expectedOutput": "[0,1]" } ],
    "compilerRuntimeConfig": { "timeLimitMs": 2000, "memoryLimitMb": 256 }
  }
  ```
- **Zero Engine Mutations**: Adding a new DSA problem requires data/configuration ONLY. `CoreJudgeExecutor` and `ProfilingCoreJudgeExecutor` remain 100% **FROZEN**.
- **Database Impact**: Zero schema changes.
- **Rollback**: Reverts harness resolution to static template resolver.

---

### Stage 15.4 — Progressive Capacity Validation Ladder Infrastructure (1k ➔ 20k)
**Module**: `backend/tests/phase15_capacity_ladder.js`

- **Responsibilities**:
  - Automated benchmark script executing progressive workload rungs: $1\text{k} \longrightarrow 2.5\text{k} \longrightarrow 5\text{k} \longrightarrow 10\text{k} \longrightarrow 20\text{k}$ requests.
  - Measures and reports $R_{\text{min}}$, $C_{\text{sub}}$, $T_{\text{jobs}}$, $S_{\text{exec}}$, and $B_{\text{cap}}$ separately.
  - *Rule*: Capacity claims for 10k/20k will NOT be made prior to empirical validation at each ladder rung.
- **Database Impact**: Zero.

---

### Stage 15.5 — Phase 15 Composition Adapter Layer (`Phase15OrchestrationAdapter`)
**Module**: `backend/services/judge/orchestration/Phase15OrchestrationAdapter.js`

- **Frozen Gateway Protection**: `JudgeGatewayService.js` is 100% **FROZEN**. `Phase15OrchestrationAdapter` wraps gateway calls via composition without modifying `JudgeGatewayService.js`.
- **Independent Feature Flags**:
  ```env
  JUDGE_WORKER_DRIVER=child_process        # in_process | worker_threads | child_process | distributed
  JUDGE_REDIS_CLUSTER_ENABLED=true          # Enables Hash-Tag cluster sharding
  JUDGE_ASYNC_DB_PERSISTENCE_ENABLED=true  # Enables Redis Stream AOF + PEL recovery
  JUDGE_DSA_PLATFORM_ENABLED=true           # Enables declarative DSA problem platform
  ```
- **Database Impact**: Zero.
- **Rollback**: Toggling any flag to `false` instantly reverts to frozen Phase 1–14 execution path without downtime.

---

### Stage 15.6 — Security, Database Safety Audit & 179-Test Regression Validation
**Module**: `backend/tests/phase15_full_validation.test.js`

- **Responsibilities**:
  - Automated test suite validating all Phase 15 modules: worker drivers, cluster sharding, DLQ, Redis AOF stream durability, PEL recovery, DSA problem platform, and progressive ladder infrastructure.
  - Database Safety Audit: Confirms 0 `DROP`, 0 `TRUNCATE`, 0 `DELETE` collection operations, 0 schema mutations, max 20 MongoDB connections.
  - Full Regression Pass: Executes Phase 8–14 test suites, verifying **179 / 179** existing tests remain 100% passing.

---

## 3. Exact File-Level Specification

| File Path | Status | Responsibilities & Governance |
| :--- | :--- | :--- |
| `backend/services/judge/orchestration/scaling/drivers/WorkerThreadsPoolDriver.js` | **NEW** | Node `worker_threads` pool driver implementing `IWorkerPoolDriver`. |
| `backend/services/judge/orchestration/scaling/drivers/ChildProcessWorkerPoolDriver.js` | **NEW** | Independent local OS sub-process worker driver implementing `IWorkerPoolDriver`. |
| `backend/services/judge/orchestration/scaling/drivers/DistributedWorkerPoolDriver.js` | **NEW** | Kubernetes / container worker pod driver implementing `IWorkerPoolDriver`. |
| `backend/services/judge/orchestration/scheduling/ClusterSafeQueueAdapter.js` | **NEW** | Redis Cluster-safe queue adapter with Hash Tag `{tenantId}` alignment. |
| `backend/services/judge/orchestration/scheduling/ClusterSafeFairShareScheduler.js` | **NEW** | Cluster-safe scheduler preserving Phase 13 priority & tenant fairness. |
| `backend/services/judge/orchestration/queues/DeadLetterQueue.js` | **NEW** | Dead-letter queue manager (`sarthi:queue:dlq`). |
| `backend/services/judge/orchestration/persistence/DatabaseProtectionLayer.js` | **NEW** | Redis Stream AOF durability, consumer groups, PEL recovery, MongoDB connection cap (max 20), bulk upsert. |
| `backend/services/judge/platform/DSAProblemPlatform.js` | **NEW** | Declarative DSA problem platform & harness generator. |
| `backend/services/judge/platform/IDriverHarnessProvider.js` | **NEW** | Abstract driver harness template interface. |
| `backend/services/judge/orchestration/Phase15OrchestrationAdapter.js` | **NEW** | Composition adapter wrapping frozen `JudgeGatewayService.js`. |
| `backend/tests/phase15_worker_concurrency_benchmark.js` | **NEW** | Benchmark suite comparing 4 worker execution modes across 12 metrics. |
| `backend/tests/phase15_capacity_ladder.js` | **NEW** | Progressive capacity validation ladder script ($1\text{k} \to 20\text{k}$). |
| `backend/tests/phase15_full_validation.test.js` | **NEW** | Automated test suite for Phase 15 and full 179-test regression suite. |
| **`JudgeGatewayService.js`** | **FROZEN** | **DO NOT TOUCH**. Wrapped by `Phase15OrchestrationAdapter.js`. |
| **`CoreJudgeExecutor.js`** | **FROZEN** | **DO NOT TOUCH**. Wrapped by `ProfilingCoreJudgeExecutor.js`. |
| **Phases 1–14 Core Modules** | **FROZEN** | **DO NOT TOUCH**. All Phase 1–14 core executors, schedulers, sandbox drivers, warm pools, compilation caches, and profilers remain 100% frozen. |

---

## 4. Mandatory Database Safety Rules

1. **Zero Schema Mutations**: No Mongoose schema files modified or created during Phase 15.
2. **Zero Destructive Queries**: `DROP`, `TRUNCATE`, or collection `deleteMany({})` without filter are strictly prohibited.
3. **Bounded Connections**: MongoDB connection pool capped at max 20 connections.
4. **Idempotent Persistence**: Results persisted via `bulkWrite` with `upsert: true` on `jobId`.
5. **No Production Reset**: Zero test reset code targeting production database URIs.

---

## 5. Explicit Phase 15 Non-Goals

1. Modifying frozen Phase 1–14 contracts or interfaces (`JudgeGatewayService.js`, `CoreJudgeExecutor.js`).
2. Hardcoding Kubernetes as the mandatory runtime without benchmark evidence.
3. Claiming 10k/20k capacity prior to progressive ladder benchmark validation.
