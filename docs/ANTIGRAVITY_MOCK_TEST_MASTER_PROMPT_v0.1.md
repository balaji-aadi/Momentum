# Antigravity Prompt — Sarthi Mock Test Module
## Version 0.1 — Audit First / No Coding Yet

You are working on the existing Sarthi application.

Sarthi already has a completed Judge Engine through Phase 15. Treat the Judge Engine as an existing capability that Mock Test will consume. Do NOT redesign or extend the Judge Engine unless the repository audit identifies a concrete integration requirement.

We are now beginning the Sarthi Mock Test / Assessment system.

IMPORTANT:
Do NOT start modifying code yet.

First perform a complete repository audit and understand the existing architecture.

I have provided two project documents alongside this prompt:

1. `SARTHI_MOCK_TEST_MASTER_BLUEPRINT_v0.1.md`
2. `SARTHI_MOCK_TEST_IMPLEMENTATION_PHASE_PLAN_v0.1.md`

The Master Blueprint is the current product source of truth.
The implementation phase plan is derived from it but is NOT more authoritative than the Blueprint.

---

# Product Objective

Sarthi Mock Test is NOT intended to be a generic quiz system.

The most important product objective is:

> Can the candidate recognize and apply a familiar algorithmic/technical pattern when it appears in an unfamiliar problem?

Normal Sarthi learning teaches patterns using the existing problem bank.

Mock Tests should assess whether the candidate can transfer those patterns to an unfamiliar problem surface.

---

# Two Modes

## MODE 1 — Sarthi Assessment

This is an assessment, not casual practice.

The user can choose:
- Full assessment
- Topic-wise assessment
- Skill-wise assessment
- Custom scope

Example:
Arrays + Strings + JavaScript.

If the user selects Arrays, interpret it according to the competency model, not current Arena names.

The assessment should use unseen assessment-grade problems.

Do not simply repeat questions the user already solved.

---

## MODE 2 — Sarthi Interview Simulation

The user selects:
- Company
- Role
- Experience
- Optional resume

Sarthi determines the complete interview structure from a versioned company/role blueprint.

If the blueprint contains 5 rounds, the user must attempt all 5.

The user cannot:
- Remove rounds
- Skip rounds
- Reorder rounds
- Replace rounds
- Lower difficulty
- Customize the company's round structure

Every Mode 2 simulation must contain at least one DSA round.

Resume can influence technical depth and questions but cannot remove mandatory DSA or blueprint-required rounds.

---

# Multi-Round Simulation

A simulation consists of:

Round 1
→ Break
→ Round 2
→ Break
→ Round 3
→ ...

A simulation can be completed in:
- One sitting
- Two days
- Three days

Maximum simulation window is three calendar days.

The user may choose an allowed break duration and may schedule continuation within the allowed window.

The same simulation must continue.

Do not create a new test for every day.

Server time must be authoritative.

If a user fails a round, DO NOT terminate the simulation.

They must still complete the remaining rounds.

At the end, the simulation can be NOT_CLEARED.

If the user fails to attend a scheduled round within the allowed attendance window, record the round as MISSED and apply the simulation failure/expiration rule.

Technical interruption should be distinguished from simply not attending.

---

# Assessment Problem Intelligence

This is one of the most important subsystems.

Do NOT build a generic random question selector.

The selection objective is:

> Provide an unseen problem surface that tests an intended competency/pattern.

Priority for previously unseen assessment candidates:

1. Use an existing validated problem if the user has not seen it and it fits.
2. If the user has already seen a required problem, attempt a meaningful transformation.
3. If transformation is not suitable, find an appropriate alternative problem representing the required competency/pattern.
4. If no quality problem exists, do not compromise the assessment simply to fill a slot.

---

# Problem Transformation Engine

This is NOT an "invent an entirely new algorithm" engine.

Example:

Existing learning problem:
Implement a Min-Heap.

The assessment may transform it into:
A scheduling/resource/processing scenario where the candidate must repeatedly retrieve the smallest-priority item while new items arrive.

The underlying pattern remains Min Heap/Priority Queue.

The candidate must NOT be told the pattern.

The transformation should change as appropriate:
- Context
- Story
- Terminology
- Input representation
- Output representation
- Examples
- Test cases
- Variable names
- Constraints
- Operation semantics where safe

But it must preserve:
- Intended competency
- Algorithmic invariant
- Core reasoning
- Appropriate difficulty

Changing only names or rewriting sentences is NOT sufficient.

We want meaningful surface transformation.

---

# Transformation Coverage

We want to transform MOST suitable problems.

Do NOT interpret this as "transform every problem."

Some problems are difficult or unnatural to transform.

Each problem may be:
- TRANSFORMABLE
- PARTIALLY_TRANSFORMABLE
- NOT_TRANSFORMABLE

The system should measure transformation coverage.

If transformation is poor, use an appropriate alternative problem instead.

---

# Alternative Problems

If a problem such as Merge K Sorted Lists is already seen and meaningful transformation is difficult:

Find a suitable alternative testing the same or closely related competency/pattern.

Do not blindly scrape/copy arbitrary web content.

Any external source must be legally usable/licensed/authorized.

Track source/license metadata where appropriate.

The alternative must pass:
- Correctness
- Difficulty
- Competency/pattern relevance
- Exposure/novelty
- Assessment quality

---

# Problem DNA / Canonical Specification

The existing Sarthi bank may currently be organized using:

Arena → Topic → Pattern → Problem.

Do not make Mock Test dependent on Arena names such as:
- DSA Phase 1
- DSA Phase 2
- Beginner Phase
- DSA Phase 3

Those are current learning organization and may change.

The durable assessment metadata should include concepts such as:
- Domain
- Competency
- Pattern
- Algorithmic technique
- Difficulty
- Complexity
- Input model
- Output model
- Core invariant
- Problem family
- Transformation eligibility

The candidate must not see hidden pattern/source metadata during the assessment.

---

# User Exposure

Track more than exact question ID.

The system should understand exposure to:
- Original problem
- Transformation variants
- Problem family where appropriate

The goal is to avoid giving the candidate a trivially recognizable variant after they already solved the canonical problem.

However, we still WANT to test the underlying pattern.

Example:
User solved standard Min Heap problem.
Assessment gives unfamiliar Min Heap transformation.

That is desirable.

---

# Pattern Transfer

The assessment should eventually support metrics such as:
- Pattern recognition
- Problem solving
- Implementation
- Accuracy
- Time management
- Difficulty handling
- Transfer performance

Example:

Familiar Min Heap performance: 92%
Transformed Min Heap performance: 61%

This can indicate difficulty transferring knowledge to an unfamiliar problem surface.

Do not present these as scientifically exact psychological measurements.

---

# Non-DSA Domains

Mock Tests must support more than DSA.

Depending on blueprint:
- SQL
- OOP
- Core CS
- System Design
- Machine Coding
- JavaScript
- TypeScript
- React/Frontend
- Node.js/Backend
- API Design
- Database
- Behavioral
- Resume-based technical assessment

Do not force every assessment type into MCQs.

Each domain needs an appropriate evaluation contract.

---

# Resume

Resume upload is optional for Mode 2.

Extract:
- Skills
- Technologies
- Experience
- Projects
- Architecture exposure
- Databases
- Cloud
- Other relevant claims

Use resume information to increase technical depth and ask relevant follow-ups.

Do not remove mandatory DSA.

Resume claims are claims to verify, not automatically trusted expertise.

---

# History / Review

The user should see a simulation log similar to an interview record.

Show:
- Company
- Role
- Experience
- Blueprint version
- Date
- Duration
- Final result
- Round outcomes
- Performance review
- Failure reasons
- Recommendations

Do NOT expose the complete question/test reconstruction in history.

Do NOT expose hidden source lineage or transformation metadata.

---

# Judge Engine

Use the existing Judge Engine Phase 15.

Do not rebuild it.

Coding round:
Mock Test → Judge Engine → Result → Round Evaluation.

Only change Judge Engine code if the audit proves an integration gap.

---

# Third-Party AI Dependency

Do NOT assume an external AI API is required.

The core assessment system must function without a third-party LLM dependency.

The Problem Transformation Engine should primarily be based on:
- Structured metadata
- Problem DNA
- Transformation rules/recipes
- Deterministic generators where possible
- Test-case generation
- Validation
- Judge verification
- Similarity/exposure checks
- Quality gates

Optional AI/self-hosted models can be considered later for specific tasks.

Do not build the architecture around an external AI provider.

---

# YOUR TASK NOW

Do NOT write code.

Perform a complete repository audit.

Inspect:
1. Backend structure
2. Frontend structure
3. Database schema
4. Existing CMS/problem models
5. Current user/problem attempt history
6. Existing arena/topic/pattern relationships
7. Existing Judge Engine Phase 15 architecture
8. Judge integration points
9. Authentication/authorization
10. Existing scheduling/timing infrastructure
11. Existing analytics
12. Existing file upload/resume infrastructure
13. Existing queues/workers/events if any
14. Existing testing infrastructure
15. Existing reusable UI/components
16. Existing API conventions
17. Existing database conventions
18. Existing deployment/infrastructure

Then map the current repository against the Master Blueprint.

---

# Required Audit Output

Produce a detailed report with:

## A. Current Architecture

Explain what already exists.

## B. Reusable Infrastructure

Identify what we can reuse.

## C. Mock Test Gaps

Identify exactly what does not exist.

## D. Data Model Gaps

Identify required entities/relationships.

## E. Problem Transformation Readiness

This is extremely important.

Determine:
- What metadata currently exists for each problem?
- Can we reliably identify topic/pattern/technique?
- Can we determine difficulty?
- Can we track user exposure?
- Can we create problem families?
- Can we store transformation lineage?
- What is missing?

Do NOT assume the current Arena structure is sufficient.

## F. Judge Integration

Explain exactly how Mock Test coding rounds can consume the existing Phase 15 Judge Engine without modifying it.

## G. Scheduling/Simulation Readiness

Determine whether the current backend supports:
- server-authoritative timers
- scheduled continuation
- round state
- break state
- attendance windows
- expiration
- recovery

## H. Resume Readiness

Determine whether resume upload/extraction already exists and what can be reused.

## I. Risks

List architectural and product risks.

## J. Recommended Architecture

Propose the smallest clean architecture that fits the current Sarthi codebase.

## K. Implementation Plan

After the audit, create a repository-specific implementation plan mapped to the Master Blueprint phases.

Do NOT blindly follow the draft phase plan if the repository proves a better sequence is necessary.

Explain any proposed phase changes.

---

# Critical Rules

1. Do not code yet.
2. Do not redesign the existing Judge Engine unnecessarily.
3. Do not treat current Arena names as permanent architecture.
4. Do not build a generic quiz system.
5. Do not build a superficial "AI rewriter" for problems.
6. Do not assume every problem must be transformed.
7. Do not assume every problem needs an alternative.
8. Do not copy arbitrary web problems.
9. Do not expose pattern/source lineage to candidates.
10. Do not allow users to customize company round structure.
11. Do not stop a simulation merely because a round failed.
12. Do not make the browser the authority for timers.
13. Do not introduce third-party AI as a mandatory dependency.
14. Do not start implementation until the audit and architecture plan are reviewed.

At the end, clearly state:

- What you understand about the product
- What the repository already supports
- What is missing
- What should be built first
- What should explicitly NOT be built yet
- Any assumptions that require confirmation

STOP after the audit and implementation proposal.
Do not modify source code.
