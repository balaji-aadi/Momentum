# Sarthi Judge Engine — Production Evolution Master Plan

## 1. Purpose

We are continuing the development of the **Sarthi Judge Engine**.

Phases 1–10 have already been designed, implemented, reviewed, and are considered **frozen/approved**.

Do **NOT** casually redesign or modify those phases.

The purpose of this task is to create a **single source-of-truth architecture and implementation roadmap** for the evolution of the Judge Engine from its current state into a production-grade, scalable distributed code-judging platform.

This document serves as the reference point for future development. If a future developer, AI agent, or new conversation context does not remember previous decisions, this document explains:
- Where the Judge Engine currently stands.
- What Phases 1–10 established.
- What is currently missing and why missing pieces are necessary.
- What the next phases are and how they depend on each other.
- What must **NOT** be changed.
- What should be implemented next in Phase 11.

---

## 2. Current Position & Codebase Architecture

The existing Sarthi Judge Engine consists of two primary operational layers:

### Layer A — Judge Core (Phases 1–10: Frozen Core)
Phases 1–10 establish the synchronous judging capability:

```text
Problem Definition (MongoDB / InputSpecification)
        ↓
Problem Understanding / Inference (UnifiedInferenceEngine)
        ↓
Input Representation (InputParserRegistry & Data Primitives)
        ↓
Canonical Output Representation (OutputSerializerRegistry & Normalizers)
        ↓
Comparator / Judge (ComparatorRegistry & VerdictEngine)
        ↓
Immutable ProblemPackage (ProblemPackageCompiler / SHA-256 Signatures)
        ↓
Driver Generation (DriverGeneratorService & Language Generators)
        ↓
Runtime Process Execution (RuntimeProcessExecutor & SandboxOrchestrator)
        ↓
Execution Result & Output Envelope Parsing
        ↓
Verdict (ACCEPTED, WRONG_ANSWER, TLE, MLE, COMPILE_ERROR, RUNTIME_ERROR)
```

This layer answers:
> *"Given one execution request, how does Sarthi correctly and safely judge a user's code?"*

This core is considered **frozen** and must remain intact.

---

## 3. Empirically Audited Codebase Findings & Contradictions

A comprehensive audit of the repository (`backend/services/judge/`, `backend/services/judge-service/`, `backend/models/`, `backend/tests/`) revealed the following key operational aspects and documentation contradictions:

### Key Codebase Realities:
1. **Dual Core Architecture (v1 vs. v2)**:
   - **v1 Judge Pipeline**: `RunCodeService.js` and `SubmitCodeService.js` (located in `backend/services/judge-service/`) directly orchestrate driver generation (`DriverGeneratorService`) and process execution (`SandboxOrchestrator`). This pipeline is currently used by HTTP endpoints (`POST /api/v1/judge/run` and `POST /api/v1/judge/submit`).
   - **v2 Package Architecture**: `ProblemPackage.js`, `PackageCompiler.js`, `StatelessJudgeRuntime.js`, and `ProviderRegistry.js` (located in `backend/services/judge/v2/`) implement immutable SHA-256 sealed problem packages and provider-based capability scoring as outlined in ADR-001 through ADR-004.
2. **Multi-Language Driver Support**:
   - *Documentation Contradiction*: Older documentation (`SARTHI_ARCHITECTURE_ENGINEERING_DOCUMENTATION.md`) states that only Python 3 is implemented.
   - *Codebase Audit*: Complete driver generators exist for **Python** (`PythonDriverGenerator.js`), **C++** (`CppDriverGenerator.js`), **Java** (`JavaDriverGenerator.js`), and **JavaScript** (`JavaScriptDriverGenerator.js`), validated by unit tests in `backend/tests/driverGenerator.test.js`.
3. **Sandbox & Process Isolation Taxonomy**:
   - Execution is currently handled by `RuntimeProcessExecutor.js` spawning Node.js `child_process.spawn` on the host API server.
   - Security relies on static token/regex filtering (`securitySanitizer.js`) and process-level timeout watchdog timers (`SIGKILL`).
   - We establish a 3-tier taxonomy: **Tier 1 Minimum Isolation** (unprivileged user, tmpfs, `ulimit`, `cgroups v2`, `securitySanitizer`) for Phase 11 dev; **Tier 2 Hardened Container Isolation** (`DockerSandboxDriver` / `nsjail` with `--network none`) for Phase 12 production workers; and **Tier 3 MicroVM Isolation** (gVisor runsc) for Phase 14.

---

## 4. Phase 1–10 Detailed Audit Matrix

| Phase | Objective | Actual Implementation File(s) | Key Interfaces / Contracts | Production Readiness | Known Gaps & Constraints | Frozen Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Problem Schema & CMS Modeling | `backend/models/problem.model.js`, `backend/services/judge/v2/specs/InputSpecification.js` | Schema definition for parameters, functionDefinition, visible & hidden test cases | Functional | Embedded hidden testcases in Mongo doc risk 16MB document size limits under large test suites. | **FROZEN** |
| **Phase 2** | Starter Code & Monaco Templates | `backend/services/judge/generators/TemplateGeneratorService.js` | `generateStarterCode(lang, functionDef)` | Production Ready | Handles standard primitive and array types across Python, JS, C++, Java. | **FROZEN** |
| **Phase 3** | Input Parsers | `backend/services/judge/inputParsers/` (Array, String, Primitive, Custom) | `InputParserRegistry.parse(input, typeSpec)` | Production Ready | Tree/Graph pointer structures require explicit custom parser classes. | **FROZEN** |
| **Phase 4** | Output Serializers & Normalizers | `backend/services/judge/outputSerializers/`, `backend/services/judge/normalizers/` | `OutputSerializerRegistry.serialize()`, `OutputNormalizers.normalize()` | Production Ready | Large output matrix serialization memory allocation. | **FROZEN** |
| **Phase 5** | Comparators & Verdict Matching | `backend/services/judge/comparators/` (ExactMatch, UnorderedArray, FloatTolerance) | `ComparatorRegistry.compare(actual, expected, comparatorName)` | Production Ready | Custom comparator protection against infinite loops in author JS code. | **FROZEN** |
| **Phase 6** | Language Driver Harness Generators | `backend/services/judge/driverGenerator/` (Python, C++, Java, JS) | `DriverGeneratorService.generateDriverHarness(lang, code, def, profile, testCases)` | Production Ready | High-precision timing via sentinel markers `__SARTHI_JUDGE_OUTPUT_START__`. | **FROZEN** |
| **Phase 7** | Runtime Process Execution | `backend/services/judge/runners/RuntimeProcessExecutor.js` | `RuntimeProcessExecutor.execute({ language, sourceCode, limits })` | Functional | Process execution runs directly on API host machine without container isolation. | **FROZEN** |
| **Phase 8** | Synchronous Run Code Service | `backend/services/judge-service/runCode.service.js` | `RunCodeService.run({ problem, language, code, customTestCases })` | Synchronous / Non-scalable | Directly executes visible testcases inside Express HTTP handler. | **FROZEN** |
| **Phase 9** | Synchronous Submit Code Service | `backend/services/judge-service/submitCode.service.js` | `SubmitCodeService.submit({ problem, language, code, userId })` | Synchronous / Non-scalable | Directly executes hidden testcases inside Express HTTP handler; persists `Submission` record. | **FROZEN** |
| **Phase 10** | Sandbox Security & Resource Limits | `backend/services/judge/sandbox/SandboxOrchestrator.js`, `securitySanitizer.js` | `SandboxOrchestrator.execute()`, `securitySanitizer.sanitize()` | Functional | Security relies on regex AST token checks; lacks OS-level container isolation. | **FROZEN** |

---

## 5. End-to-End Pipeline Diagram (Current Architecture)

```text
+-----------------------------------------------------------------------------------+
|                            CURRENT PIPELINE ARCHITECTURE                          |
+-----------------------------------------------------------------------------------+
  Client (Browser / Monaco Editor)
       │
       │ Synchronous HTTP POST /api/v1/judge/run or /submit
       ▼
  Express API Gateway (Judge Router & Judge Controller)
       │
       │ Query MongoDB
       ▼
  MongoDB (Problems & Hidden TestCases)
       │
       │ Synchronous In-Process Call
       ▼
  RunCodeService / SubmitCodeService (Synchronous HTTP Handlers)
       │
       ├──> SecuritySanitizer (Static Code Token Sanitization)
       ├──> DriverGeneratorService (Generates Python / C++ / Java / JS Driver Harness)
       ├──> SandboxOrchestrator / RuntimeProcessExecutor (Spawns child_process on API Host)
       │         │
       │         ▼
       │    Subprocess Execution (python3 / node / g++ / javac)
       │         │
       │         ▼ (Sentinel Output: __SARTHI_JUDGE_OUTPUT_START__)
       │    Parse Envelope JSON & Execution Metrics
       │
       └──> ComparatorRegistry (ExactMatch / UnorderedArrayMatch / FloatTolerance)
       │
       │ Persist Submission Record in Mongo (if Submit)
       ▼
  HTTP Response Returned Directly to Client
```

---

## 6. What the Current System Does NOT Solve

While the current Judge Core correctly judges an individual code execution, it cannot handle production-scale concurrent workloads:

> *"How do we safely and reliably execute thousands of independent user submissions when many users submit code simultaneously?"*

### Critical Vulnerabilities of the Current Model:
1. **HTTP Server Starvation**: Running untrusted user code directly inside Express HTTP handlers blocks event loops and consumes host CPU/RAM. Under 100 concurrent requests, host resources are exhausted, crashing the entire Web API.
2. **Lack of Traffic Spike Absorption**: Without a queue, traffic surges instantly turn into CPU thrashing rather than waiting as manageable queue depth.
3. **No Durable Job Identity or Lifecycle**: Submissions are ephemeral HTTP requests. Network drops or server restarts result in total state loss.
4. **No Idempotency / Duplicate Protection**: Rapid user clicks create redundant executions and corrupted database records.
5. **No Worker Recovery / Retries**: Host crashes cause in-flight executions to disappear permanently without retry or notification.

---

## 7. The Target Model & Fundamental Architectural Rule

The evolution to production requires shifting from synchronous handler execution to an asynchronous queue-and-worker architecture.

### Target Architecture:

```text
Client
   ↓
Judge Gateway (HTTP 202 Accepted)
   ↓
Execution Job (Durable Identity)
   ↓
Execution Queue (Redis / In-Memory Abstraction)
   ↓
Judge Worker Pool (Controlled Execution Concurrency)
   ↓
CoreJudgeExecutor (Pure Phase 1-10 Pipeline)
   ↓
ISandboxDriver (Host / Container Isolation)
   ↓
Verdict & Result Store (MongoDB / Redis Result Store)
   ↓
Client Polling / WebSocket Notification
```

### The Cardinal Architectural Rule:
> **HTTP/API servers must NEVER directly execute untrusted student code in the production architecture.**

---

## 8. Revised Production Evolution Roadmap

The evolution will occur across four distinct, controlled phases:

```text
Phase 11 ──> Execution Orchestration (Jobs, Queue Abstraction, Gateway, Workers, CoreJudgeExecutor, Tier-1 Sandbox)
Phase 12 ──> Reliability, Observability & Security Hardening (Tier-2 Container Sandbox, Tracing, Metrics, Heartbeats)
Phase 13 ──> Horizontal Scaling & Capacity Management (Multi-Worker Pods, Rate Limits, Capacity Scheduling)
Phase 14 ──> Advanced Production Optimization (Tier-3 Hypervisor/gVisor, Warm VM Pools, Package Caching)
```

---

## 9. Phase 11 — Execution Orchestration (Detailed Specification)

### 9.1 Objectives & Scope
Introduce asynchronous job handling, queue abstractions, gateway endpoints, background worker processes, idempotency guards, and result persistence **without modifying the frozen Judge Core (Phases 1–10)**.

### 9.2 Key Components & Services
1. **`JudgeGatewayService`**:
   - Accepts HTTP `/api/v1/judge/run` and `/api/v1/judge/submit` requests.
   - Validates requests, checks `IdempotencyGuard`, creates `ExecutionJob`, pushes to `IExecutionQueue`, and returns an immediate `202 Accepted` response with `jobId` and status URI (`/api/v1/judge/jobs/:jobId`).
2. **`CoreJudgeExecutor`** (`backend/services/judge/executor/CoreJudgeExecutor.js`):
   - Extracted transport-independent application service wrapping the frozen Phase 1–10 pipeline.
   - Executes driver generation, sandbox execution, output parsing, and comparator matching in pure memory with **zero database side-effects**.
3. **`ExecutionJob` Domain Model**:
   - `jobId` (UUIDv4)
   - `userId` (ObjectId / string)
   - `problemId` (ObjectId / string)
   - `packageVersion` & `packageHash`
   - `submissionId` (for SUBMIT execution type)
   - `executionType` (`'RUN'` vs `'SUBMIT'`)
   - `language` (`'python'`, `'javascript'`, `'cpp'`, `'java'`)
   - `code` (inline student source code string up to 64KB)
   - `priority` (`HIGH` for SUBMIT, `NORMAL` for RUN)
   - `state` (`CREATED`, `QUEUED`, `CLAIMED`, `RUNNING`, `COMPLETED`, `FAILED`, `RETRYING`, `CANCELLED`, `EXPIRED`, `INFRA_ERROR`)
   - `idempotencyKey` (UUIDv4 / SHA-256 hash)
   - `attemptCount` & `maxAttempts`
   - Timestamps: `createdAt`, `startedAt`, `completedAt`
   - `result` (Verdict payload, testcase outcomes, execution metrics)
4. **Job State Machine**:
   ```text
   CREATED ──> QUEUED ──> CLAIMED ──> RUNNING ──> COMPLETED
     │          │          │          │
     └──> FAILED / CANCELLED / EXPIRED / INFRA_ERROR (Exceptional States)
   ```
5. **Queue Abstraction Layer (`IExecutionQueue`)**:
   - Abstract interface: `enqueue(job)`, `dequeue()`, `claim(jobId, workerId)`, `ack(jobId)`, `nack(jobId, reason)`.
   - `MemoryExecutionQueue`: In-memory priority queue for local development and unit tests.
   - `RedisExecutionQueue`: Redis/BullMQ implementation for production distributed deployments.
6. **`JudgeWorker` Engine**:
   - Independent service process that polls/subscribes to `IExecutionQueue`.
   - Respects worker concurrency limits (e.g., max 5 concurrent process executions per worker).
   - Invokes `CoreJudgeExecutor.execute(...)`.
   - Persists final verdict and updates job state to `COMPLETED` or `FAILED`.
7. **`IdempotencyGuard`**:
   - Dual-tier model: Client `Idempotency-Key` header (60s TTL) + 5-second server-side code-hash double-click fallback window. Validates `packageHash`.
8. **Retry & Recovery Policy**:
   - **User Failures** (`COMPILE_ERROR`, `RUNTIME_ERROR`, `WRONG_ANSWER`, `TIME_LIMIT_EXCEEDED`, `MEMORY_LIMIT_EXCEEDED`): **Deterministic / Non-Retryable**. Immediately marked `COMPLETED` with verdict.
   - **Infrastructure Failures** (`WORKER_CRASH`, `SANDBOX_UNAVAILABLE`, `PROCESS_ERROR`): **Retryable**. Retried up to 3 times with exponential backoff before transitioning to `INFRA_ERROR`.
9. **4-Tier SLO Matrix**:
   - **Gateway Ack SLO**: **p95 $< 30\text{ ms}$** (`202 Accepted`).
   - **Queue Wait Time SLO**: **p95 $< 200\text{ ms}$** (normal load); **p95 $< 3000\text{ ms}$** (peak bursts).
   - **Execution & Judging SLO**: Bounded by `problem.executionLimits.timeLimitMs` + harness overhead.
   - **End-to-End Completion SLO**: **p95 $< 2.5\text{s}$** (Python/JS RUN); **p95 $< 5.0\text{s}$** (C++/Java SUBMIT).

---

## 10. Dependency Graph & Freeze Boundaries

```text
Phase 1 (CMS Schema / InputSpec) ────┐
Phase 2 (Template Generator) ────────┼──> Frozen Judge Core (Phases 1–10)
Phase 3 (Input Parsers) ─────────────┤        │
Phase 4 (Output Serializers) ────────┤        │ Invoked By
Phase 5 (Comparators & Verdict) ─────┤        ▼
Phase 6 (Driver Generators) ─────────┼──> CoreJudgeExecutor (Phase 11)
Phase 7 (Runtime Executor) ──────────┤        ▲
Phase 8 (Run Code Logic) ────────────┤        │ Invoked By
Phase 9 (Submit Code Logic) ─────────┤        │
Phase 10 (Sandbox Isolation) ────────┘   Judge Worker (Phase 11)
                                              ▲
                                              │ Consumes Jobs From
                                         Execution Queue (Phase 11)
                                              ▲
                                              │ Pushes Jobs To
                                         Judge Gateway (Phase 11)
                                              ▲
                                              │ HTTP Requests
                                         Client / Arena
```

---

## 11. Explicit Non-Goals for Phase 11

Phase 11 will **NOT**:
- Modify or refactor any code inside Phases 1–10 (`DriverGeneratorService`, `RuntimeProcessExecutor`, `ComparatorRegistry`, `securitySanitizer`).
- Enforce Docker / gVisor container sandboxing in Phase 11 (reserved for Phase 12).
- Implement cluster autoscaling or dynamic worker container provisioning (reserved for Phase 13).
- Turn MongoDB into an execution queue.
- Retry student compilation or runtime errors.

---

## 12. PHASE 11 IMPLEMENTATION GATE

The complete pre-implementation gate specification is codified in [`SARTHI_JUDGE_PHASE_11_ARCHITECTURE_REVIEW.md`](file:///Users/balajiaadesh/Desktop/Sarthi/SARTHI_JUDGE_PHASE_11_ARCHITECTURE_REVIEW.md#4-phase-11-implementation-gate).

---

## 13. Governance & Hierarchy Rule

All future implementation tasks must strictly adhere to the following hierarchy of truth:

```text
Frozen Phase 1–10 Architecture
            ↓
Production Evolution Master Plan
            ↓
Phase 11 Architecture Review (v3.0.0)
            ↓
Current Phase Implementation Plan
            ↓
Actual Repository
            ↓
Implementation
            ↓
Tests
```

If any future instruction or request conflicts with this document, **STOP and resolve the conflict before proceeding**.