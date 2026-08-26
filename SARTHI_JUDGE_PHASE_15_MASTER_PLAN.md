# Sarthi Judge Engine — Phase 15 Master Architecture & Evolution Plan
## Distributed Scale Infrastructure, Worker Concurrency Benchmarks & DSA Problem Platform

---

## 1. Executive Summary & Evolutionary Context

### 1.1 Long-Term Evolution Roadmap
The **Sarthi Judge Engine** follows a strict, multi-phase production evolution model:

```
Phase 1–10 (Frozen Judge Core)
  ├── Drivers, Comparators, Serializers, Process Runners, Security Regex
  └── Baseline Execution Engine & Output Evaluation
        │
Phase 11 (Frozen Execution Orchestration)
  ├── Transport-Independent CoreJudgeExecutor & JobStateMachine
  ├── Dual-Tier IdempotencyGuard & RetryEngine
  └── Redis / Memory ExecutionQueue & Background JudgeWorker
        │
Phase 12 (Frozen Security, Reliability & Observability)
  ├── Tier-2 Hardened OCI Container Sandbox (DockerContainerSandboxDriver)
  ├── Dual-Mount Ephemeral Workspace (/workspace exec vs /tmp noexec)
  ├── Fenced Job Lease Ownership Tokens (WorkerLeaseManager)
  └── Structured Context JSON Logging & Privacy Protections
        │
Phase 13 (Frozen Horizontal Scaling & Capacity Management)
  ├── Multi-Tenant Fair-Share Queue Scheduling (FairShareScheduler)
  ├── Tenant Rate Limiting (JudgeRateLimiter) & Gateway Backpressure
  └── Dynamic Worker Auto-Scaler Engine (WorkerAutoScaler)
        │
Phase 14 (Frozen Sandbox Optimization & Security Hardening)
  ├── Nanosecond Stage Profiling (ExecutionStageProfiler & ProfilingCoreJudgeExecutor)
  ├── Single-Flight Compilation Artifact Cache (CompilationArtifactCache)
  ├── Pre-Forked Warm Container Pools (WarmContainerPool) & Destruction Gate
  └── Sub-Kernel Virtualization Driver (gVisorSandboxDriver)
        │
Phase 15 (Current Planning — Distributed Infrastructure & DSA Problem Platform)
  ├── Canonical Capacity Terminology & Progressive Validation Ladder (1k -> 20k)
  ├── Empirical Worker Concurrency Benchmark Methodology (InProcess vs Threads vs Procs vs Pods)
  ├── Redis Cluster Hash-Tag Sharding & Multi-Key Lua Atomicity
  ├── DatabaseProtectionLayer Durability & Redis AOF Recovery Semantics
  └── First-Class DSA Problem & Driver Harness Platform (Zero Judge Engine Mutations)
```

---

## 2. Canonical Capacity Terminology & Measurement Definitions

To prevent ambiguity, Phase 15 establishes strict, standardized definitions for system capacity:

1. **Requests / Minute ($R_{\text{min}}$)**: Ingestion rate of incoming evaluation requests received at API Gateway.
2. **Concurrent Submissions ($C_{\text{sub}}$)**: Total active in-flight submissions across both queue depth and active worker processing.
3. **Jobs / Minute Throughput ($T_{\text{jobs}}$)**: Total successfully completed evaluation jobs per minute.
4. **Simultaneous Execution Concurrency ($S_{\text{exec}}$)**: Number of sandbox containers running code at the exact same physical instant ($\sum \text{worker.maxConcurrency}$).
5. **Burst Capacity ($B_{\text{cap}}$)**: Peak instantaneous request surge accepted by API Gateway without dropping requests or triggering load shedding.

---

## 3. Empirical Worker Concurrency Benchmark Methodology

### 3.1 Resolving the ~57s Queue Wait Bottleneck Hypothesis
Rather than assuming the ~57s queue wait (p95) observed under local testing is caused solely by the Node.js event loop, Phase 15 introduces an **Empirical Worker Concurrency Benchmark** comparing 4 distinct worker execution architectures:

```
[ Worker Architecture Benchmark Suite ]
  ├── 1. InProcessWorkerPoolDriver    (Local Node event loop simulation)
  ├── 2. WorkerThreadsPoolDriver      (Node worker_threads module)
  ├── 3. ChildProcessWorkerPoolDriver  (Independent OS sub-processes)
  └── 4. DistributedWorkerPoolDriver (K8s / Container worker pods)
```

### 3.2 Benchmark Metrics Matrix
Each architecture will be benchmarked under identical 500-job workloads, measuring:
- Throughput ($T_{\text{jobs}}$ / sec)
- Queue wait time (p50 / p95 / p99)
- CPU utilization & core saturation
- Event-loop lag (`perf_hooks` eventLoopUtilization)
- Worker slot utilization
- Redis command latency
- Heap & RSS memory growth
- End-to-end completion time (p50 / p95 / p99)

---

## 4. Phase 15 Architectural Pillars

### 4.1 Pillar A: Redis Cluster Hash-Tag Sharding & Atomicity Architecture

To ensure multi-key Lua scripts and tenant scheduling operations function seamlessly across Redis Cluster hash slots without cross-slot violations:

- **Hash Tag Sharding Standard**: All keys associated with a specific tenant use Redis Hash Tags `{tenantId}`:
  - Queue Key: `sarthi:queue:{tenantId}:priority`
  - Ring Key: `sarthi:tenant_ring:{priority}`
  - Rate Limit Key: `sarthi:ratelimit:{tenantId}`
  - Lease Key: `sarthi:lease:{jobId}`
- **Slot Alignment**: Guaranteeing all tenant-specific multi-key atomic operations map to the same Redis Cluster hash slot, preventing `CROSSSLOT Keys in request` errors.

---

### 4.2 Pillar B: `DatabaseProtectionLayer` Durability & Recovery Semantics

To protect MongoDB from write saturation during burst loads while guaranteeing data durability:

```
[ Incoming Result ] ──► [ Redis Stream / AOF Write ] ──► [ Ack to Worker ]
                                  │
                                  ▼ (Async Bulk Persist)
                         [ MongoDB Replica Set ]
```

1. **Durability Definition**: A submission result is considered **durable** once written to Redis Append-Only File (AOF with `appendfsync everysec`) or MongoDB.
2. **Failure Recovery Protocol**: If Redis or host process crashes before bulk sync to MongoDB, the recovery daemon reads uncommitted stream entries from Redis AOF log upon restart and flushes them to MongoDB with zero data loss.
3. **Connection Cap**: MongoDB connection pool capped at max 20 connections; bulk insert workers write in batches of 100 docs.

---

### 4.3 Pillar C: First-Class DSA Problem & Driver Harness Platform (`DSAProblemPlatform`)

Adding a new DSA problem, programming language, or custom harness MUST require **ZERO code modifications to the core judge engine**:

```
[ New DSA Problem Metadata ]
  ├── problem_id: "two-sum"
  ├── language: "cpp"
  ├── harness_template: "templates/cpp_harness.tpl"
  └── testcases: [ { input: "...", output: "..." } ]
               │
               ▼ (Ingested via Configuration API / JSON)
[ Core Judge Engine (FROZEN) ] ──► Executes cleanly without code changes
```

- **Harness Provider (`IDriverHarnessProvider`)**: Problem metadata defines driver templates declaratively.
- **Engine Protection**: `CoreJudgeExecutor`, `ProfilingCoreJudgeExecutor`, and all runner logic remain 100% **FROZEN**.

---

### 4.4 Pillar D: Progressive Capacity Validation Ladder (1k ➔ 20k)

Phase 15 enforces a progressive, empirical capacity ladder:

$$\text{Stage 1: 1,000} \longrightarrow \text{Stage 2: 2,500} \longrightarrow \text{Stage 3: 5,000} \longrightarrow \text{Stage 4: 10,000} \longrightarrow \text{Stage 5: 20,000}$$

*Governance Requirement*: Capacity thresholds (10k / 20k) will NOT be claimed as achieved until empirically measured and verified at each rung of the ladder.

---

## 5. Preservation of Frozen Boundaries (Phases 1–14)

The following components remain 100% **FROZEN** and untouched in Phase 15:
- `CoreJudgeExecutor` & `ProfilingCoreJudgeExecutor`
- `WorkerLeaseManager` & Authoritative Lease Ownership
- `JobStateMachine`
- `FairShareScheduler` & `FairShareQueueAdapter`
- `JudgeRateLimiter` & `BackpressureManager`
- `CapacityAwareRouter`
- `DockerContainerSandboxDriver` & `gVisorSandboxDriver`
- `WarmContainerPool` & `CompilationArtifactCache`
- `ExecutionStageProfiler`

---

## 6. Governance Sequence

```
SARTHI_JUDGE_PHASE_15_MASTER_PLAN.md (Current Step)
         │
         ▼ (User Review & Approval)
SARTHI_JUDGE_PHASE_15_ARCHITECTURE_REVIEW.md
         │
         ▼ (User Review & Approval)
SARTHI_JUDGE_PHASE_15_IMPLEMENTATION_PLAN.md
         │
         ▼ (User Review & Approval)
Phase 15 Sub-Stage Implementation & Empirical Benchmarking
```

*Status*: Master Plan regenerated for review. No implementation code, architecture reviews, or implementation plans written.
