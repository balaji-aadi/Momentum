# Sarthi Judge Engine — Phase 13 Concrete Implementation Plan
## Horizontal Scaling & Capacity Management Infrastructure

---

## 1. Unified Control Loop Architecture

The Phase 13 horizontal scaling and capacity control loop acts as a single, coordinated system protecting worker infrastructure from overload while guaranteeing fair execution capacity across tenants:

```
                  [ Incoming HTTP API Request ]
                               │ (Headers: x-correlation-id, x-trace-id)
                               ▼
                    ┌─────────────────────┐
                    │  JudgeRateLimiter   │
                    └──────────┬──────────┘
                               │ (Checks authenticated userId / anonymous IP)
                               ▼
                    ┌─────────────────────┐
                    │ BackpressureManager │
                    └──────────┬──────────┘
                               │ (Evaluates composite H_sys: ACCEPT / THROTTLE / SHED)
                               ▼
                 ┌───────────────────────────┐
                 │  FairShareQueueAdapter    │ (Implements IExecutionQueue contract)
                 └─────────────┬─────────────┘
                               │ (Enqueues to sarthi:queue:tenant:<userId>:<priority>)
                               ▼
                    ┌─────────────────────┐
                    │ FairShareScheduler  │
                    └──────────┬──────────┘
                               │ (Atomic Lua: Deterministic Ring Cursor Interleaving)
                               ▼
                    ┌─────────────────────┐
                    │ CapacityAwareRouter │
                    └──────────┬──────────┘
                               │ (Soft 60/40 allocation & dynamic slot borrowing)
                               ▼
                    ┌─────────────────────┐
                    │  Worker Pool Array  │ ◄──────┐
                    └──────────┬──────────┘        │
                               │                   │ (Calls scaleTo(target) via
                               ▼                   │  IWorkerPoolDriver)
                    ┌─────────────────────┐        │
                    │   WorkerAutoScaler  ├────────┘
                    └─────────────────────┘
```

---

## 2. File & Module Structure

### 2.1 New Modules to Create in Phase 13
1. **`backend/services/judge/orchestration/scheduling/FairShareQueueAdapter.js`**: Queue adapter implementing `IExecutionQueue` interface for tenant-aware Redis queue ingestion.
2. **`backend/services/judge/orchestration/scheduling/FairShareScheduler.js`**: Multi-tenant priority scheduler with atomic Redis tenant-ring cursor rotation.
3. **`backend/services/judge/orchestration/scaling/WorkerAutoScaler.js`**: Pure domain auto-scaler decision engine (decoupled from infrastructure).
4. **`backend/services/judge/orchestration/scaling/drivers/IWorkerPoolDriver.js`**: Abstract worker pool driver interface.
5. **`backend/services/judge/orchestration/scaling/drivers/InProcessWorkerPoolDriver.js`**: Local Node.js worker pool driver.
6. **`backend/services/judge/orchestration/scaling/drivers/ProcessClusterWorkerPoolDriver.js`**: Process cluster pool driver.
7. **`backend/services/judge/orchestration/rateLimiting/JudgeRateLimiter.js`**: Redis sliding window token bucket rate limiter.
8. **`backend/services/judge/orchestration/capacity/BackpressureManager.js`**: Multi-factor backpressure engine with configurable policy parameters.
9. **`backend/services/judge/orchestration/capacity/CapacityAwareRouter.js`**: Workload classification (`LIGHTWEIGHT` vs `HEAVY`) and soft slot borrowing.

### 2.2 Phase 11/12 Modules to Modify
1. **`backend/services/judge/orchestration/JudgeGatewayService.js`**: Integrates `JudgeRateLimiter` and `BackpressureManager` middleware before job queue ingestion.
2. **`backend/services/judge/orchestration/JudgeWorker.js`**: Integrates with `CapacityAwareRouter` and `FairShareScheduler`.
3. **`backend/services/judge-service/judge.controller.js`**: Handles `HTTP 429` and `HTTP 503` backpressure responses.

### 2.3 Frozen Phase 1–12 Baseline Modules (MUST REMAIN UNTOUCHED)
- **Phase 1–10 Core**: Driver generators, comparators, serializers, process runners (`RuntimeProcessExecutor`).
- **Phase 11 Core**: `CoreJudgeExecutor`, `ExecutionJob`, `JobStateMachine`, `IdempotencyGuard`, `RetryEngine`, `RedisExecutionQueue`.
- **Phase 12 Core**: `DockerContainerSandboxDriver`, `WorkerLeaseManager`, `JudgeLogger`, `JudgeMetricsCollector`.

---

## 3. Interfaces & Technical Contracts

### 3.1 Tenant Queue Ingestion & Atomic Lease Claim Lifecycle
`FairShareQueueAdapter` implements the frozen `IExecutionQueue` interface contract.
The job ownership and claim lifecycle is strictly single-authoritative:

```
Tenant Queue (sarthi:queue:tenant:<userId>:<priority>)
         │
         ▼ (Atomic Lua Dequeue / LPOP)
FairShareScheduler Dequeue
         │
         ▼
WorkerLeaseManager.issueLease(job, workerId)  <-- Phase 12 Authoritative Lease
         │
         ▼
JobStateMachine.transition(job, CLAIMED)       <-- Phase 11 Monotonic State
         │
         ▼
Worker Execution (CoreJudgeExecutor)
```

- **Race Condition Prevention**: Dequeue is atomic via Redis Lua script / `LPOP`. Concurrent workers cannot claim the same job because the job payload is popped before lease issuance. Phase 12 `WorkerLeaseManager` remains 100% authoritative for lease TTLs (`leaseExpiresAt`) and fencing tokens (`leaseId`).

### 3.2 Canonical Execution-Slot Capacity Calculation
Tenant capacity is calculated strictly against the summation of `maxConcurrency` across all currently active workers:

$$\text{TOTAL\_EXECUTION\_SLOTS} = \sum_{i=1}^{W_{\text{active}}} \text{worker}_i.\text{maxConcurrency}$$

$$\text{tenantMaxSlots} = \left\lceil \text{TOTAL\_EXECUTION\_SLOTS} \times \text{JUDGE\_MAX\_TENANT\_CAPACITY\_RATIO} \right\rceil$$

- **Heterogeneous Pool Support**: Supports worker pools where different nodes have distinct slot capacities (e.g. Node 1 with 5 slots + Node 2 with 10 slots ➔ `TOTAL_EXECUTION_SLOTS = 15`).
- **Distinction**: `W_active` is active worker process/instance count; `TOTAL_EXECUTION_SLOTS` is total concurrent slot capacity.

### 3.3 Deterministic Multi-Tenant Round-Robin Scheduling
To avoid unordered set iteration in Redis, Phase 13 introduces an atomic Redis tenant-ring cursor:
- `sarthi:queue:tenant_ring:<priority>`: Redis List containing active tenant IDs.
- Dequeue Lua script performs `RPOPLPUSH sarthi:queue:tenant_ring:<priority> sarthi:queue:tenant_ring:<priority>` to rotate tenant selection atomically.
- **Interleaving Guarantee**: When tenants A, B, and C have pending jobs, dequeues follow deterministic sequence:
  $$A_1 \longrightarrow B_1 \longrightarrow C_1 \longrightarrow A_2 \longrightarrow B_2 \longrightarrow C_2$$
- Concurrent workers cannot corrupt the cursor or cause unfair repeated selection of the same tenant.

### 3.4 Soft 60/40 Capacity Allocation & Borrowing Specification
- **Allocation**: 60% of `TOTAL_EXECUTION_SLOTS` allocated to `LIGHTWEIGHT` (Python/Node), 40% allocated to `HEAVY` (C++/Java).
- **Soft Reservation Behavior**:
  - If `HEAVY` queue is empty, `LIGHTWEIGHT` jobs can consume **100%** of available slots.
  - If `LIGHTWEIGHT` queue is empty, `HEAVY` jobs can consume **100%** of available slots.
- **Borrowing Conditions**: When `HEAVY` p95 wait time $> 5000\text{ms}$ and `LIGHTWEIGHT` slot utilization (`activeLightweightSlots / maxLightweightSlots`) $< 0.30$ (30%), `CapacityAwareRouter` borrows up to 50% of idle `LIGHTWEIGHT` slots for `HEAVY` jobs.
- **Reclamation Behavior**: Idle borrowed slots are immediately reclaimed by `LIGHTWEIGHT` as soon as new `LIGHTWEIGHT` jobs arrive.

---

## 4. Redis Data Structures & Key Strategy

| Purpose | Redis Key Format | Data Structure | TTL / Expiry |
| :--- | :--- | :--- | :--- |
| **Tenant Sub-Queue** | `sarthi:queue:tenant:<userId>:<priority>` | Redis List (`RPUSH`/`LPOP`) | Ephemeral |
| **Tenant Ring Cursor** | `sarthi:queue:tenant_ring:<priority>` | Redis List (`RPOPLPUSH`) | Ephemeral |
| **Rate Limit Log** | `sarthi:ratelimit:<identity>:<executionType>` | Redis Sorted Set (`ZADD`/`ZCARD`) | 60 seconds |
| **AutoScaler State** | `sarthi:scaling:state` | Redis Hash (`HSET`) | Persistent |

---

## 5. System Algorithms & State Machines

### 5.1 Fair-Share Scheduling Algorithm
1. Inspect priority sets: `HIGH` (`SUBMIT`) evaluated before `NORMAL` (`RUN`).
2. Read active tenant count from `sarthi:queue:tenant_ring:<priority>`.
3. **Single-Tenant Optimization**: If ring length === 1, dequeue directly from that tenant's queue, utilizing **100% of available worker capacity**.
4. **Multi-Tenant Contention**: If ring length >= 2:
   - Rotate tenant ring cursor via atomic `RPOPLPUSH`.
   - Enforce `tenantMaxSlots = ceil(TOTAL_EXECUTION_SLOTS * 0.25)`.
   - Dequeue oldest FIFO job from selected tenant sub-queue.

### 5.2 Multi-Factor Backpressure Health Index ($H_{\text{sys}}$)
$H_{\text{sys}}$ is calculated using configurable policy parameters:

$$H_{\text{sys}} = w_q \left(\frac{Q_{\text{depth}}}{Q_{\text{max}}}\right) + w_t \left(\frac{T_{\text{wait\_p95}}}{T_{\text{max\_slo}}}\right) + w_u \left(U_{\text{worker}}\right) + w_m \left(\frac{M_{\text{heap}}}{M_{\text{max}}}\right)$$

- Policy Weights: $w_q = 0.35, w_t = 0.35, w_u = 0.15, w_m = 0.15$ (configurable).
- Action Thresholds:
  - $H_{\text{sys}} < 0.70$ ➔ `ACCEPT` (`HTTP 202 Accepted`).
  - $0.70 \le H_{\text{sys}} < 0.90$ ➔ `THROTTLE` (reduces user rate limits by 50%).
  - $H_{\text{sys}} \ge 0.90$ ➔ `SHED` (`HTTP 503 Service Unavailable` + `Retry-After: 5`).

---

## 6. Configuration & Environment Variables

```env
# Phase 13 Scaling & Rate-Limiting Flags
JUDGE_AUTOSCALING_ENABLED=true
JUDGE_RATE_LIMITING_ENABLED=true
JUDGE_BACKPRESSURE_ENABLED=true

# AutoScaler Parameters
JUDGE_MIN_WORKERS=2
JUDGE_MAX_WORKERS=20
JUDGE_SCALE_UP_WINDOW_SEC=10
JUDGE_SCALE_DOWN_IDLE_SEC=30

# Rate Limits
JUDGE_SUBMIT_RATE_LIMIT=10
JUDGE_RUN_RATE_LIMIT=30
JUDGE_ANON_SUBMIT_RATE_LIMIT=5
JUDGE_ANON_RUN_RATE_LIMIT=15

# Capacity & Backpressure Policy Parameters
JUDGE_MAX_QUEUE_CAPACITY=1000
JUDGE_MAX_QUEUE_WAIT_SLO_MS=10000
JUDGE_MAX_TENANT_CAPACITY_RATIO=0.25
```

---

## 7. Expanded Validation Suite Strategy (`tests/phase13_scaling_capacity.test.js`)

1. **Integration Test 1 (Priority + Fairness)**:
   - User A (100 `RUN`), User B (1 `SUBMIT`), User C (1 `RUN`).
   - Verifies User B's `SUBMIT` is dequeued first. User C's `RUN` is dequeued before User A's 2nd `RUN`.
2. **Integration Test 2 (Intra-Priority Deterministic Ring Fairness)**:
   - User A (100 `SUBMIT`), User B (1 `SUBMIT`).
   - Verifies deterministic rotation ($A_1 \to B_1 \to A_2$), placing User B in round 1.
3. **Integration Test 3 (Autoscaling + Fairness)**:
   - User A floods 500 jobs across 2 workers. Scaler expands pool. User B submits 1 job.
   - Verifies newly spawned workers immediately enforce tenant ring fairness.
4. **Zero-Regression Verification**:
   - Run Phase 8–12 test suites. Confirm **134 / 134** existing tests pass 100%.

---

## 8. Explicit Phase 14 Non-Goals

1. Warm container pre-forking pools (Phase 14 optimization).
2. gVisor / Firecracker micro-VM integration (Phase 14 optimization).
3. Zero-copy kernel socket piping (Phase 14 optimization).
