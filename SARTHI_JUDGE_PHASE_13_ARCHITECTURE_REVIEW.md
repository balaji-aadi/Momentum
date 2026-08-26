# Sarthi Judge Engine — Phase 13 Architecture Review & Deep Dive
## Technical Resolutions for Scaling, Fair-Share Scheduling, Rate-Limiting & Backpressure

---

## 1. WorkerAutoScaler Architecture & Infrastructure Abstraction

### 1.1 Decoupled Scaling Abstraction
The `WorkerAutoScaler` is an abstract scaling decision engine and worker pool orchestrator. To prevent tight coupling to any specific infrastructure provider (Kubernetes, AWS ECS, systemd, or Node process clusters), scaling management is split into two layers:

```
[ WorkerAutoScaler ] (Domain Scaling Logic & Telemetry Monitor)
         │
         ▼
[ IWorkerPoolDriver ] (Abstract Driver Interface)
  ├── InProcessWorkerPoolDriver       (Node.js Worker Threads - Local Dev)
  ├── ProcessClusterWorkerPoolDriver (Node.js Cluster / PM2 - Single Node)
  └── K8sHPAWorkerPoolDriver         (Kubernetes Deployment / HPA - Cloud)
```

### 1.2 Scaling Parameters & Hysteresis Specification

| Scaling Parameter | Production Value | Technical Purpose |
| :--- | :--- | :--- |
| `minWorkers` | `2` (Default) | Always-on baseline worker pool. Guarantees zero cold-start delay for initial jobs. |
| `maxWorkers` | `20` (Configurable) | Hard safety ceiling. Prevents runaway infrastructure cost or host RAM exhaustion. |
| `scaleUpTrigger` | `Q_len > 0.8 * W_capacity` OR `T_wait_p95 > 3000ms` for `10s` | Scale-up condition evaluated over a 10-second sliding window. |
| `scaleDownTrigger` | `Q_len === 0` AND worker idle time `> 30s` | Scale-down condition requiring 30 seconds of sustained zero backlog. |
| `cooldownUp` | `15s` | Minimum delay between consecutive scale-up actions. |
| `cooldownDown` | `60s` | Minimum delay between consecutive scale-down actions (prevents flapping). |
| `hysteresisBuffer` | `±10%` queue depth | Deadband buffer preventing scale oscillations around threshold boundaries. |
| `scaleStepMaxUp` | `+4 workers` per step | Prevents sudden thread creation spikes. |
| `scaleStepMaxDown`| `-2 workers` per step | Gradual worker termination to allow active jobs to finish cleanly. |
| `maxScalingRate` | `1 action / 15s` | Enforced rate limit on scaler execution cycles. |
| `failureBehavior` | Fallback to `minWorkers` | If scaler thread or metrics collector fails, existing active workers continue processing without interruption. |

---

## 2. Rate Limiting Identity Hierarchy & Quota Management

### 2.1 Identity Hierarchy & Resolution
Client identity is evaluated in a strict hierarchy:

```
Client Request
  ├── Authenticated Token (JWT / Session) ──► Identity: userId (e.g., "usr_99f8a")
  └── Anonymous Request                  ──► Identity: IP Address (req.ip / x-forwarded-for)
```

### 2.2 Quota Interaction & Isolation
- **Independent Quota Buckets**: `RUN` and `SUBMIT` operate on separate sliding window token buckets. An authenticated user executing 30 `RUN` calls does not consume their `SUBMIT` quota.
- **Configurable Default Limits**:
  - Authenticated `RUN`: `30 requests / minute` (configurable via `JUDGE_RUN_RATE_LIMIT`).
  - Authenticated `SUBMIT`: `10 requests / minute` (configurable via `JUDGE_SUBMIT_RATE_LIMIT`).
  - Anonymous IP `RUN`: `15 requests / minute`.
  - Anonymous IP `SUBMIT`: `5 requests / minute`.
- **Enforcement**: Implemented in `JudgeRateLimiter` using Redis sliding window logs (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`).

---

## 3. Priority Reconcilation & Multi-Tenant Fair-Share Scheduling

### 3.1 Priority & Fairness Reconciliation Matrix
Phase 11 priority queues (`SUBMIT` = `HIGH`, `RUN` = `NORMAL`) are reconciled with Phase 13 multi-tenant fairness using a **Weighted Fair Priority Scheduler**:

```
           [ Incoming Job Pipeline ]
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
 [ HIGH Priority ]             [ NORMAL Priority ]
 (SUBMIT Jobs)                 (RUN Jobs)
       │                               │
       ▼                               ▼
 [ User Sub-Queues ]           [ User Sub-Queues ]
 (User A, User B...)           (User A, User B...)
       │                               │
       └───────────────┬───────────────┘
                       ▼
         [ FairShareScheduler Dequeue ]
  (1. Priority Class -> 2. Interleaved User Round-Robin -> 3. FIFO Age)
```

### 3.2 Single-Tenant Non-Starvation Policy
- **CRITICAL**: If only ONE user or tenant has pending work in the queue, fair-share throttling is **disabled**.
- The single user is permitted to consume **100% of available worker execution capacity**. Fair-share interleaving activates ONLY when multiple competing tenants have pending jobs.

---

## 4. Semantics of the 25% User Capacity Cap

- **Contention-Based Activation**: The 25% capacity cap (`JUDGE_MAX_TENANT_CAPACITY_RATIO = 0.25`) applies **exclusively when $N \ge 2$ users are competing for queue execution slots**.
- **Formula**: `MaxUserSlots = ceil(W_active * maxConcurrency * 0.25)`.
- **Configurability**: Ratio is configurable via environment variable `JUDGE_MAX_TENANT_CAPACITY_RATIO`.

---

## 5. Multi-Factor Backpressure & Load Shedding

### 5.1 System Health Index Calculation ($H_{\text{sys}}$)
Instead of relying solely on raw queue depth, `BackpressureManager` computes a composite system health score $H_{\text{sys}} \in [0.0, 1.0]$:

$$H_{\text{sys}} = 0.35 \left(\frac{Q_{\text{depth}}}{\text{MAX\_QUEUE}}\right) + 0.35 \left(\frac{T_{\text{wait\_p95}}}{\text{SLO\_WAIT}}\right) + 0.15 \left(U_{\text{worker}}\right) + 0.15 \left(M_{\text{heap}}\right)$$

### 5.2 Three-Tier Gate Action Matrix

| Health Index ($H_{\text{sys}}$) | Gate Action | HTTP Response Behavior |
| :--- | :--- | :--- |
| $H_{\text{sys}} < 0.70$ | `ACCEPT` | Normal processing. Returns `HTTP 202 Accepted` with `jobId`. |
| $0.70 \le H_{\text{sys}} < 0.90$ | `THROTTLE` | Soft overload. User rate limits reduced by 50%. Returns `HTTP 202 Accepted`. |
| $H_{\text{sys}} \ge 0.90$ | `SHED` | Critical overload. Early load shedding. Returns `HTTP 503 Service Unavailable` with header `Retry-After: 5`. |

---

## 6. Capacity-Aware Job Routing & Resource Classes

### 6.1 Workload Classification
Jobs are categorized into two resource classes:
- **`LIGHTWEIGHT`**: Python 3, Node.js (interpreted execution, near-zero compilation latency).
- **`HEAVY`**: C++ (GCC 13), Java (JDK 21) (requires CPU-intensive compilation phase).

### 6.2 Routing & Dynamic Borrowing
- Worker execution capacity is partitioned: 60% allocated to `LIGHTWEIGHT`, 40% allocated to `HEAVY`.
- **Dynamic Borrowing**: If the `HEAVY` pool is saturated while `LIGHTWEIGHT` capacity is idle, `CapacityAwareRouter` dynamically borrows unused `LIGHTWEIGHT` worker slots for `HEAVY` compilation jobs.

---

## 7. Explicit Phase 14 Boundary Reservations

The following advanced execution runtime optimizations are strictly reserved for Phase 14:
1. **Warm Container Pre-Forking Pools**: Maintaining pre-warmed container pools to eliminate OCI container launch overhead.
2. **gVisor / Firecracker Micro-VM Integration**: Sub-kernel virtualization replacing standard OCI Docker containers.
3. **Zero-Copy Kernel I/O Piping**: Direct kernel splice/vmsplice stream piping for testcase evaluation.

Phase 13 focuses exclusively on **orchestration, queue scheduling, auto-scaling, rate-limiting, and capacity backpressure**.
