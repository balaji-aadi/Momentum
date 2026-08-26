# Sarthi Judge Engine — Phase 13 Master Architecture & Evolution Plan
## Horizontal Scaling & Capacity Management Framework

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
  ├── Transport-Independent CoreJudgeExecutor
  ├── ExecutionJob Domain Model & JobStateMachine
  ├── Dual-Tier IdempotencyGuard & RetryEngine
  ├── Memory & Redis ExecutionQueue Adapters
  ├── JudgeWorker Pool & JudgeGatewayService
  └── Feature-Flagged Controller Migration (JUDGE_ASYNC_ORCHESTRATION_ENABLED)
        │
Phase 12 (Frozen Security, Reliability & Observability)
  ├── Tier-2 Hardened OCI Container Sandbox (DockerContainerSandboxDriver)
  ├── Dual-Mount Ephemeral Workspace Architecture (/workspace exec vs /tmp noexec)
  ├── Fenced Job Lease Ownership Tokens & Crash Recovery (WorkerLeaseManager)
  ├── Worker Liveness, Readiness & Execution Capacity Probes
  ├── Secure Internal Prometheus Observability Telemetry (Zero worker_id cardinality)
  └── Structured Context JSON Logging & Privacy Protections
        │
Phase 13 (Current Planning — Horizontal Scaling & Capacity Management)
  ├── Dynamic Worker Pool Scaling & Auto-Scaler Engine (WorkerAutoScaler)
  ├── Per-User & Tenant Token Bucket Rate-Limiting (JudgeRateLimiter)
  ├── Multi-Tenant Fair-Share Queue Scheduling (FairShareScheduler)
  ├── Gateway Overload Backpressure & Early Load Shedding (BackpressureManager)
  └── Capacity-Aware Job Routing & Worker Pool Partitioning
        │
Phase 14 (Future — Advanced Optimization & Micro-VM Hardening)
  └── gVisor/nsjail Sandbox Optimization, Warm Container Pools, Zero-Copy I/O
```

---

## 2. Audit of Baseline Capabilities (Phases 11 & 12) vs Phase 13 Requirements

### 2.1 What Phases 11 & 12 Already Solve
- **Asynchronous Execution & Queue Drivers**: HTTP handlers accept jobs instantly into `RedisExecutionQueue` (`sarthi:queue:high` and `sarthi:queue:normal`).
- **Idempotency & Deduplication**: Prevents duplicate submissions via client keys and RUN/SUBMIT sliding window hashes.
- **Worker Execution Core & Lease Fencing**: Workers claim jobs via `leaseId` fencing tokens, preventing duplicate processing upon worker crash/partitioning.
- **Container Isolation & Observability**: Code executes inside unprivileged OCI containers (`--network none`, `--read-only`, `seccomp`). Structured JSON logs and Prometheus metrics export queue depth and duration histograms without `worker_id` label pollution.

### 2.2 Why Phase 13 is Required
While Phases 11 and 12 secure individual worker execution and job state safety, they operate with **static worker instances** and **unprotected queue ingestion**:
1. **Starvation Risk**: A single malicious user or script submitting 5,000 rapid requests can flood Redis queues, filling worker slots and starving legitimate users.
2. **Resource Exhaustion**: Ingestion at `JudgeGatewayService` is uncapped. If queue backlog grows to tens of thousands of jobs, system memory degrades without early backpressure load shedding.
3. **Static Worker Allocation**: Worker pools cannot dynamically expand during burst traffic (e.g. coding contests, exam submissions) or scale down to save resources during idle hours.

Phase 13 introduces **dynamic horizontal worker scaling, tenant rate-limiting, fair-share queue scheduling, and backpressure load shedding**.

---

## 3. Scope, Dependencies & Non-Goals

### 3.1 Dependencies on Frozen Baseline
Phase 13 builds strictly on top of frozen Phases 1–12 without altering their core contracts:
- **`ExecutionJob` & `JobStateMachine`**: Reused unchanged.
- **`RedisExecutionQueue`**: Extended via multi-tenant queue keys (`sarthi:queue:tenant:<userId>`).
- **`JudgeWorker`**: Reused as worker execution primitive spawned by `WorkerAutoScaler`.
- **`JudgeMetricsCollector` & `JudgeLogger`**: Telemetry and correlation logging (reused unchanged).

### 3.2 Phase 13 Scope
1. **Dynamic Worker Pool Auto-Scaler (`WorkerAutoScaler`)**: Monitors queue backlog and pending queue wait times; dynamically scales worker instances between `minWorkers` (e.g., 2) and `maxWorkers` (e.g., 20) with scale-up triggers and scale-down cooldown timers.
2. **Per-User Rate-Limiter (`JudgeRateLimiter`)**: Redis-backed Sliding Window Token Bucket enforcing submission limits (e.g. max 10 SUBMIT/min, 30 RUN/min per user). Rejects excessive requests with `HTTP 429 Too Many Requests`.
3. **Multi-Tenant Fair-Share Queue Scheduler (`FairShareScheduler`)**: Prevents any single user from occupying >25% of active worker execution capacity when multiple users have pending jobs.
4. **Gateway Backpressure & Load Shedding (`BackpressureManager`)**: Monitors system health metrics (queue depth, p95 wait time, worker utilization). Rejects requests with `HTTP 503 Service Unavailable` + `Retry-After` header when queue depth exceeds threshold `MAX_QUEUE_CAPACITY` (e.g., 1,000 jobs).
5. **Capacity-Aware Job Routing (`CapacityAwareRouter`)**: Partitions worker pools between lightweight runtime jobs (Python, Node) and heavy compilation jobs (C++, Java) to optimize throughput.

### 3.3 Non-Goals (Reserved for Phase 14)
- **Do NOT implement warm container pre-forking** (Phase 14 optimization).
- **Do NOT implement gVisor / Firecracker / nsjail kernel sandboxing** (Phase 14 optimization).
- **Do NOT implement zero-copy kernel socket pipes** (Phase 14 optimization).

---

## 4. Architectural Boundaries & Component Interaction

```
[ HTTP Client / API Request ] ──► (x-correlation-id, x-trace-id)
                                          │
                                          ▼
                         [ JudgeGatewayService ]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
       [ JudgeRateLimiter ]                            [ BackpressureManager ]
  (Sliding Window Token Bucket)                  (Queue Depth & Wait Time SLA Check)
  ├── Exceeded -> HTTP 429                        └── Overloaded -> HTTP 503 Shedding
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          ▼
                           [ FairShareScheduler ]
                     (Distributes user queue backlogs)
                                          │
                                          ▼
                            [ RedisExecutionQueue ]
                                          │
             ┌────────────────────────────┴────────────────────────────┐
             ▼                                                         ▼
  [ WorkerAutoScaler ] ──(Spawns / Reclaims)──► [ CapacityAwareRouter ]
 (Dynamic Pool 2..20)                                (Routes Python vs C++/Java)
                                                                       │
                                                                       ▼
                                                          [ JudgeWorker Pool ]
                                                                       │
                                                                       ▼
                                                       [ CoreJudgeExecutor ]
                                                                       │
                                                                       ▼
                                                     [ DockerContainerSandboxDriver ]
```

---

## 5. Scaling, Capacity, Scheduling & Backpressure Models

### 5.1 Dynamic Worker Scaling Model (`WorkerAutoScaler`)
- **Metrics Tracked**:
  - `Q_len`: Aggregate queue length across priority queues (`sarthi:queue:high` + `sarthi:queue:normal`).
  - `T_wait_p95`: 95th percentile estimated queue wait time.
  - `W_active`: Current active worker pool size.
- **Scale-Up Rule**: If `Q_len > (W_active * maxConcurrency * 0.8)` or `T_wait_p95 > 3000ms` continuously for `10s`, trigger scale-up:
  `W_target = min(maxWorkers, ceil(Q_len / maxConcurrency))`
- **Scale-Down Rule**: If `Q_len === 0` and worker idle time `> 30s`, terminate excess worker instances down to `minWorkers`.

### 5.2 Per-User Rate Limiting Model (`JudgeRateLimiter`)
- Implemented as a Redis sliding window algorithm (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`).
- Quotas:
  - `RUN`: 30 requests per minute per `userId` / IP.
  - `SUBMIT`: 10 requests per minute per `userId` / IP.
- Violations return `HTTP 429 Too Many Requests` with payload `{ success: false, error: 'Rate limit exceeded', retryAfterSeconds: 15 }`.

### 5.3 Multi-Tenant Fair-Share Scheduling (`FairShareScheduler`)
- Prevents single-user queue starvation by organizing jobs into per-user virtual queues inside Redis.
- Worker dequeue uses a Weighted Round-Robin interleaving strategy across active user queues, capping any single user at max 25% concurrent worker slots when other users are queued.

### 5.4 Gateway Overload Backpressure (`BackpressureManager`)
- Defines system safety limits:
  - `MAX_QUEUE_CAPACITY`: 1,000 jobs.
  - `MAX_QUEUE_WAIT_TIME_SLO`: 10,000 ms (10 seconds).
- When thresholds are breached, `JudgeGatewayService` initiates **Early Load Shedding**: returns `HTTP 503 Service Unavailable` with `Retry-After: 5` header, protecting Redis memory and preventing cascading worker failure.

---

## 6. Migration, Rollback & Acceptance Criteria

### 6.1 Feature Flags & Rollback Strategy
- Flags:
  - `JUDGE_AUTOSCALING_ENABLED=true/false` (controls dynamic worker spawning).
  - `JUDGE_RATE_LIMITING_ENABLED=true/false` (controls rate-limiter enforcement).
  - `JUDGE_BACKPRESSURE_ENABLED=true/false` (controls early load shedding).
- Rollback: Setting all flags to `false` instantly reverts system behavior to Phase 11/12 static worker pool and uncapped queue ingestion without service interruption.

### 6.2 Acceptance Criteria
1. **Rate Limiting Containment**: Submitting >10 SUBMIT requests/min from a single user triggers `HTTP 429` with valid `retryAfterSeconds`.
2. **Fair-Share Anti-Starvation**: Single user submitting 500 jobs cannot starve 5 concurrent single-job users; single-job users complete within <2s.
3. **Dynamic Scaling Verification**: Burst load of 200 jobs automatically scales worker pool from `minWorkers` (2) up to target capacity within 10s, and scales down after idle cooldown.
4. **Backpressure Load Shedding**: Queue overload beyond 1,000 jobs triggers `HTTP 503` early load shedding.
5. **Zero Regression**: 100% pass rate across existing **134 / 134** automated tests.
