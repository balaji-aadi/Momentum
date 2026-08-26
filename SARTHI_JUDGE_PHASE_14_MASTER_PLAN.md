# Sarthi Judge Engine — Phase 15 Master Architecture & Evolution Plan
## Distributed 10,000+ Scale Infrastructure, Cloud Auto-Scaling & DSA Problem Platform

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
Phase 15 (Current Planning — 10k+ Scale Infrastructure & DSA Problem Platform)
  ├── 10,000+ Concurrent Submission Scale Capacity Architecture
  ├── Distributed Cloud Worker Infrastructure (K8s / ECS Worker Pods)
  ├── Analysis of In-Process Single-Thread Bottleneck (Resolving ~57s Queue Wait)
  ├── Sharded Redis Stream Queue Architecture & Dead-Letter Queues (DLQ)
  ├── Database Protection, Read-Replica Splitting & Connection Pooling Caps
  └── Extensible DSA Problem & Harness Platform (Zero Judge Engine Mutations)
```

---

## 2. Phase 14 Performance Audit & Root-Cause Bottleneck Analysis

### 2.1 Empirical Phase 14 Benchmark Findings
Phase 14 achieved **100% correctness, security, and reliability** (179/179 tests passed, 0 lost jobs, 0 duplicate claims, 0 DB mutations). However, empirical benchmark measurements revealed:

- **API Gateway Ack Latency (p95)**: **$6\text{ ms}$** (Ultra-fast ingestion).
- **Queue Wait Time (p95)**: **$57.3\text{ s}$** (Under 500-request burst workload).
- **End-to-End Completion Time (p95)**: **$60.4\text{ s}$**.

### 2.2 Root-Cause Diagnosis of In-Process Worker Bottleneck
Empirical stage profiling (`ExecutionStageProfiler`) proved that **$100\%$** of execution latency occurs inside `ProgramExecution`. 

The root cause for the ~57s queue wait under local testing is that `InProcessWorkerPoolDriver` executes worker loops inside a **single Node.js process thread**. When spawning container processes (`docker run`), Node's synchronous sub-process communication blocks the single event loop, causing worker tasks to run sequentially rather than in true parallel kernel threads.

**Phase 15 Solution**: Replaces local in-process simulation with **Distributed Cloud Worker Pods (`K8sHPAWorkerPoolDriver`)** operating across independent CPU cores and worker nodes, unlocking true parallel container execution.

---

## 3. Phase 15 Core Architectural Pillar Specifications

### 3.1 Pillar A: 10,000+ Concurrent Submission Scale Architecture

```
[ 10,000+ Concurrent Submissions ]
               │
               ▼
[ API Gateway Layer / Rate Limiter / Backpressure ]
               │ (Async Ack in < 10ms)
               ▼
[ Sharded Redis Cluster Queues (Tenant Ring + Priority) ]
               │
               ▼
[ Distributed Worker Fleet (K8s HPA Auto-Scaling Pods) ]
  ├── Worker Pod 1 ──► [Warm gVisor Pool] ──► [Exec]
  ├── Worker Pod 2 ──► [Warm gVisor Pool] ──► [Exec]
  └── Worker Pod N ──► [Warm gVisor Pool] ──► [Exec]
```

- **Target Capacity**: 10,000 concurrent submissions / minute.
- **SLO Target**: API Ack $p95 < 10\text{ ms}$, Queue Wait $p95 < 2.0\text{ s}$ in distributed cloud environment.

---

### 3.2 Pillar B: Database Protection & Isolation Engine (`DatabaseProtectionLayer`)

To protect MongoDB from crashing under 10,000+ concurrent submission writes:
1. **Read/Write Splitting**: Metadata queries (problems, testcases) read from secondary read-replicas or Redis cache (`sarthi:cache:problem:<id>`).
2. **Asynchronous Batch Persistence**: Submission results are buffered in a Redis write stream (`sarthi:stream:submission_results`) and persisted to MongoDB via bulk insert workers, capping active DB connection pools.
3. **Zero DB Mutation in Core Execution**: Judge execution remains 100% decoupled from database writes during processing.

---

### 3.3 Pillar C: Extensible DSA Problem & Harness Platform Architecture

Adding a new DSA problem, programming language, or custom harness MUST require **ZERO modifications to the core judge engine**:

```
[ New DSA Problem Metadata ]
  ├── problem_id: "two-sum"
  ├── language: "cpp"
  ├── harness_template: "templates/cpp_harness.tpl"
  └── testcases: [ { input: "...", output: "..." } ]
               │
               ▼ (Ingested via Configuration API)
[ Core Judge Engine (FROZEN) ] ──► Executes cleanly without code changes
```

#### Harness Extensibility Interface (`IDriverHarnessProvider`)
- Problems specify a declarative harness specification (`JSON`/`YAML`).
- `CoreJudgeExecutor` and `ProfilingCoreJudgeExecutor` remain 100% frozen; problem generators inject driver templates via configuration metadata only.

---

### 3.4 Pillar D: Sharded Redis Cluster Queues & Dead-Letter Queues (DLQ)
- **Sharded Tenant Rings**: Queue keys sharded across Redis Cluster nodes (`sarthi:queue:tenant:{tenantId}:priority`).
- **Dead-Letter Queue (`sarthi:queue:dlq`)**: Jobs failing max retry attempts transition to DLQ for manual inspection and automatic alerting without blocking tenant queues.

---

## 4. Preservation of Frozen Boundaries (Phases 1–14)

The following components remain 100% **FROZEN** and untouched in Phase 15:
- `CoreJudgeExecutor` & `ProfilingCoreJudgeExecutor`
- `WorkerLeaseManager` & Authoritative Lease Ownership
- `JobStateMachine`
- `FairShareScheduler` & `FairShareQueueAdapter`
- `JudgeRateLimiter` & `BackpressureManager`
- `CapacityAwareRouter`
- `DockerContainerSandboxDriver` & `gVisorSandboxDriver`
- `WarmContainerPool` & `CompilationArtifactCache`

---

## 5. Phase 15 Governance Roadmap

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
Phase 15 Sub-Stage Implementation & Distributed Cloud Benchmarking
```

*Status*: Master Plan produced for review. No implementation code or implementation plans written.
