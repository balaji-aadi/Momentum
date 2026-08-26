# Sarthi Judge Engine — Phase 15 Architecture Review & Deep Dive
## Distributed Scale Architecture, Concurrency Benchmarks & DSA Problem Platform

---

## 1. Empirical Worker Concurrency Benchmark Design

### 1.1 Worker Execution Architecture Matrix
The ~57s queue wait (p95) under 500-job load is treated as an empirical hypothesis. Phase 15 designs a comparative benchmark matrix evaluating 4 worker execution models under identical 500-job workloads:

```
[ 1. InProcessWorkerPoolDriver ]   ──► Single Node event loop simulation
[ 2. WorkerThreadsPoolDriver ]     ──► Node.js worker_threads module
[ 3. ChildProcessWorkerPoolDriver ] ──► Independent local OS sub-processes
[ 4. DistributedWorkerPoolDriver ]  ──► Kubernetes / container worker pods
```

### 1.2 Comprehensive Benchmark Metrics Suite
For each architecture, the empirical benchmark framework measures 12 discrete metrics:

| Metric | Measurement API / Tool | Significance |
| :--- | :--- | :--- |
| **Throughput ($T_{\text{jobs}}$ / sec)** | Completed jobs / total elapsed time | Workload processing rate |
| **Queue Wait Time (p50 / p95 / p99)** | `startedAt - createdAt` timestamps | Ingestion to execution delay |
| **Execution Time (p50 / p95 / p99)** | `completedAt - startedAt` timestamps | Code runtime + sandbox overhead |
| **CPU Utilization (%)** | `os.cpus()` / `top` | Host CPU utilization |
| **CPU Core Saturation** | Multi-core load distribution | Parallel CPU core usage |
| **Node Event-Loop Lag (ms)** | `perf_hooks.monitorEventLoopDelay()` | Main thread blocking |
| **Worker Slot Utilization (%)** | Active running slots / total capacity | Slot efficiency |
| **Redis Command Latency (ms)** | Redis `SLOWLOG` / `process.hrtime` | Queue & lease overhead |
| **Heap & RSS Memory (MB)** | `process.memoryUsage()` | Memory footprint & leaks |
| **Container Startup Latency (ms)** | `ExecutionStageProfiler` stage | OCI sandbox creation time |
| **Compilation Latency (ms)** | `ExecutionStageProfiler` stage | GCC / javac build time |
| **Failure / Error Rate (%)** | Failed jobs / total requests | System stability under load |

*Architectural Decision Gate*: The empirical benchmark results across these 12 metrics will determine the final production worker architecture.

---

## 2. Standardized Capacity Terminology & Distinction Matrix

To eliminate ambiguity, Phase 15 enforces strict capacity terminology:

- **Requests / Minute ($R_{\text{min}}$)**: Total evaluation requests arriving at API Gateway per minute.
- **Concurrent Submissions ($C_{\text{sub}}$)**: Total active in-flight requests across both queue backlog and running containers.
- **Jobs / Minute Throughput ($T_{\text{jobs}}$)**: Successfully evaluated and completed jobs per minute.
- **Simultaneous Execution Concurrency ($S_{\text{exec}}$)**: Physical count of sandbox containers running code at the exact same millisecond ($\sum \text{worker.maxConcurrency}$).
- **Burst Capacity ($B_{\text{cap}}$)**: Instantaneous surge volume accepted by API Gateway without dropping requests.

### 2.1 Critical Capacity Distinction Examples

```
Scenario A: 10,000 Requests Arriving Concurrently
├── API Gateway receives 10,000 requests in 1 second.
├── RateLimiter and Backpressure evaluate ingestion.
└── API Acks in < 10ms, queuing jobs into Redis tenant streams.

Scenario B: 10,000 Jobs Executing Simultaneously
├── Sandboxes physically running 10,000 container processes at the same millisecond.
└── Requires S_exec = 10,000 (e.g. 200 worker pods * 50 concurrency).

Scenario C: 10,000 Jobs / Minute Throughput
├── System completes 10,000 evaluations across 60 seconds (~166 jobs / sec).
└── Sustained processing throughput across worker fleet.
```

---

## 3. Redis Cluster Atomicity & Hash-Tag Audit

### 3.1 Hash Slot Mapping Audit

Multi-key Lua scripts in Redis Cluster fail with `CROSSSLOT Keys in request` if keys map to different hash slots. Phase 15 audits all queue and lease keys:

| Key Category | Key Schema | Hash Tag | Hash Slot Assignment | Cluster Safety Status |
| :--- | :--- | :--- | :--- | :--- |
| **Tenant Queue** | `sarthi:queue:{tenant_A}:priority` | `{tenant_A}` | Slot mapped to `tenant_A` | **SAFE** |
| **Rate Limiter** | `sarthi:ratelimit:{tenant_A}` | `{tenant_A}` | Slot mapped to `tenant_A` | **SAFE** |
| **Tenant State** | `sarthi:tenant_state:{tenant_A}` | `{tenant_A}` | Slot mapped to `tenant_A` | **SAFE** |
| **Job Lease** | `sarthi:lease:{job_123}` | `{job_123}` | Slot mapped to `job_123` | Single key operation |
| **Tenant Ring** | `sarthi:tenant_ring:{priority}` | `{priority}` | Slot mapped to `priority` | Redesigned for Cluster |
| **Dead-Letter Queue** | `sarthi:queue:dlq:{shard_0}` | `{shard_0}` | Slot mapped to `shard_0` | **SAFE** |

### 3.2 Redesign of Multi-Tenant Ring Rotation for Redis Cluster
In a Redis Cluster, `sarthi:tenant_ring:{priority}` (hash tag `{priority}`) and `sarthi:queue:{tenant_A}:priority` (hash tag `{tenant_A}`) reside on **different hash slots**. Executing a multi-key Lua script across them causes a `CROSSSLOT` error.

**Redesign Resolution**:
Rather than executing a single multi-key Lua script across the tenant ring and individual tenant queues, `FairShareScheduler` executes two pipeline operations:
1. `RPOPLPUSH` on `sarthi:tenant_ring:{priority}` (single-key, cluster safe). Returns `selectedTenantId`.
2. `LPOP` on `sarthi:queue:{selectedTenantId}:priority` (single-key, cluster safe).
This decouples cross-slot keys while preserving deterministic tenant round-robin scheduling.

---

## 4. `DatabaseProtectionLayer` Durability & Recovery Semantics

### 4.1 End-to-End Pipeline
```
[ Worker Finish ] ──► [ Redis Stream XADD + AOF ] ──► [ Worker Ack ]
                             │
                             ▼ (Consumer Group Read)
                    [ MongoDB Bulk Upsert ] ──► [ Stream XACK ]
```

### 4.2 Durability & Recovery Specification

1. **Durability Threshold**: A submission result becomes **durable** the instant it is appended to Redis Stream (`sarthi:stream:results`) with AOF enabled (`appendfsync everysec`).
2. **Worker Acknowledgment**: Workers acknowledge job processing to `WorkerLeaseManager` after writing to Redis Stream.
3. **Consumer Group Bulk Persistence**: A dedicated database persistence worker consumes results from Redis Stream in batches of 100 docs and executes MongoDB `bulkWrite` with `upsert: true` on `jobId`.
4. **Idempotent Bulk Upsert**: Using `jobId` as the unique index prevents duplicate persistence if a batch is reprocessed after a crash.
5. **Pending Entry List (PEL) Recovery**:
   - If DB persistence worker crashes before calling `XACK`, restarted worker queries `XPENDING` entries older than 30s, re-reads uncommitted submission results, and flushes them to MongoDB.
6. **Failure Isolation**:
   - **Redis Crash**: Redis AOF log recovers uncommitted stream entries on reboot.
   - **MongoDB Outage**: Redis Stream buffers submission results safely without affecting real-time worker execution.

---

## 5. Database Safety Audit & Isolation Assertions

- **Bounded Connection Pool**: MongoDB connection pool capped at max 20 connections.
- **Read/Write Splitting**: Problem metadata reads query secondary read-replicas or Redis cache (`sarthi:cache:problem:<id>`).
- **Zero Schema Mutations**: Zero database schema files modified during planning.
- **Zero Destructive Queries**: Zero `DROP`, `TRUNCATE`, or collection-drop behavior.

---

## 6. DSA Problem & Driver Harness Platform Subsystem (`DSAProblemPlatform`)

Adding a new DSA problem, language, or custom harness MUST require **ZERO code modifications** to frozen judge engine modules (`CoreJudgeExecutor`, `ProfilingCoreJudgeExecutor`, queues, schedulers, rate limiters, or lease managers).

```
[ New DSA Problem Input Package ]
  ├── problem_id: "two-sum"
  ├── language_configs: { "cpp": { compiler: "gcc13", flags: "-O2" } }
  ├── harness_templates: { "cpp": "templates/cpp_harness.tpl" }
  └── testcases: [ { input: "...", expectedOutput: "..." } ]
               │
               ▼ (Ingested via Configuration API / JSON Metadata)
[ Core Judge Engine (FROZEN) ] ──► Executes cleanly without engine mutations
```

- **Harness Specification**: Problem driver templates use mustache placeholders (`{{STUDENT_CODE}}`, `{{TEST_CASES}}`).
- **Language Extensibility**: Adding support for a new language (e.g. Rust, Go) requires adding a language runner template configuration, with zero changes to `CoreJudgeExecutor`.

---

## 7. Progressive Capacity Validation Ladder (1k ➔ 20k)

| Validation Step | Workload Volume | Gateway Ack SLO | Queue Wait SLO | Target Throughput |
| :--- | :--- | :--- | :--- | :--- |
| **Ladder Rung 1** | `1,000` requests | $< 10\text{ ms}$ (p95) | $< 1.5\text{ s}$ (p95) | $> 50$ jobs/sec |
| **Ladder Rung 2** | `2,500` requests | $< 10\text{ ms}$ (p95) | $< 2.0\text{ s}$ (p95) | $> 100$ jobs/sec |
| **Ladder Rung 3** | `5,000` requests | $< 10\text{ ms}$ (p95) | $< 2.5\text{ s}$ (p95) | $> 200$ jobs/sec |
| **Ladder Rung 4** | `10,000` requests | $< 15\text{ ms}$ (p95) | $< 3.0\text{ s}$ (p95) | $> 350$ jobs/sec |
| **Ladder Rung 5** | `20,000` requests | $< 20\text{ ms}$ (p95) | $< 5.0\text{ s}$ (p95) | $> 500$ jobs/sec |

*Mandatory Gate*: Capacity claims for 10k/20k will be made **ONLY** after empirical validation at each rung of the ladder.

---

## 8. Frozen Boundaries Verification Matrix

The following 14 core modules are verified as **100% FROZEN**:

1. `CoreJudgeExecutor.js`
2. `ProfilingCoreJudgeExecutor.js`
3. `WorkerLeaseManager.js`
4. `JobStateMachine.js`
5. `FairShareScheduler.js`
6. `FairShareQueueAdapter.js`
7. `JudgeRateLimiter.js`
8. `BackpressureManager.js`
9. `CapacityAwareRouter.js`
10. `DockerContainerSandboxDriver.js`
11. `gVisorSandboxDriver.js`
12. `WarmContainerPool.js`
13. `CompilationArtifactCache.js`
14. `ExecutionStageProfiler.js`

---

## 9. Phase 15 Architectural Decision Matrix

| Major Component | Proposed Design | Technical Risk | Required Empirical Evidence | Architectural Decision |
| :--- | :--- | :--- | :--- | :--- |
| **In-Process Workers** | Single-threaded Node loop | Event loop blocking | Event-loop lag benchmark | **REJECTED for Production** |
| **Worker Threads** | `worker_threads` module | Shared memory limits | Multi-thread CPU saturation | **CONDITIONAL** |
| **Child Processes** | OS sub-processes | Process spawn overhead | CPU core saturation benchmark | **APPROVED for Single-Node** |
| **Kubernetes Worker Pods**| `DistributedWorkerPoolDriver` | Cluster complexity | Multi-node scaling benchmark | **APPROVED for Cloud** |
| **Redis Cluster Sharding** | Hash tags `{tenantId}` | `CROSSSLOT` error risk | Dual-step pipeline verification | **APPROVED** |
| **MongoDB Protection** | Stream AOF + Bulk Upsert | Redis AOF disk sync | PEL recovery benchmark | **APPROVED** |
| **DSA Problem Platform** | Declarative JSON metadata | Template parsing bug | Zero-mutation harness test | **APPROVED** |
| **Dead-Letter Queue** | `sarthi:queue:dlq` | DLQ backlog | Max retry exhaustion test | **APPROVED** |
| **10k Capacity Claim** | Progressive ladder validation | Unvalidated claim | Empirical 10k rung benchmark | **DEFERRED (Pending Ladder)** |
| **20k Capacity Claim** | Progressive ladder validation | Unvalidated claim | Empirical 20k rung benchmark | **DEFERRED (Pending Ladder)** |
