# SARTHI CONTENT FACTORY — MASTER BLUEPRINT v1.0-DRAFT

## 1. Purpose
The first priority before Mock Tests is to build a reliable Sarthi Content Factory. Its job is to create, validate, version, review, and publish Sarthi-authored technical problems at scale.

Initial focus: DSA. Future domains: JavaScript, TypeScript, React, Frontend, Backend, SQL, DBMS, OOP, System Design, DevOps, Cloud, Core CS, Machine Coding, etc.

The Mock Test Engine is downstream of this Content Factory.

## 2. Core Content Principle
Sarthi should not depend on copying or mechanically paraphrasing third-party problem statements.

External platforms may be used as research/reference material for concepts, patterns, difficulty, and common interview competencies. Actual Sarthi problems should be independently authored and validated.

Important legal boundary:
- Algorithms, methods, ideas, and mathematical principles are generally not protected by copyright.
- Titles/short phrases are generally not protected by copyright.
- Rewriting third-party expression does not automatically guarantee legal safety.
- The system therefore uses independent authoring, provenance, validation, and review rather than promising zero copyright risk.
- Commercial launch content policy should be reviewed by qualified IP counsel.

## 3. Two Banks

### Learning Question Bank
Used for normal practice.
- Pattern/topic organized.
- Sarthi-authored statement, examples, constraints, tests, explanation, and solution.
- A recognizable canonical title may be retained where useful for learning/navigation.
- Separate from the Mock Test Bank.

### Mock Assessment Bank
Used only for assessments.
- Separate pool.
- User-facing title and presentation can be substantially different.
- Same underlying competency/pattern may be preserved.
- Must be sufficiently unfamiliar to test pattern transfer.
- Transformation engine is a later version, not Version 1.

## 4. Canonical Problem / Problem DNA
Every problem should have an internal structured specification:
- domain
- topic
- pattern
- competency
- difficulty
- core invariant
- input model
- output model
- constraints
- expected complexity
- relevant data structures
- acceptable solution approaches
- edge cases
- problem family
- provenance/research metadata
- generation metadata
- validation metadata

## 5. Content Factory Pipeline
Pattern/competency
→ Problem Blueprint
→ Candidate Problem
→ Reference Solution
→ Test-case generation
→ Static/content validation
→ Judge validation
→ Quality review
→ Approval
→ Publication

AI may assist, but AI is not the final authority. Manual authoring must remain possible.

## 6. AI Independence
The architecture must work without a third-party AI API. AI can propose statements, contexts, examples, constraints, reference solutions, and test ideas, but publication depends on Sarthi validation and approval.

## 7. Validation Lifecycle
GENERATED → VALIDATING → VALIDATED → REVIEW_REQUIRED → APPROVED → PUBLISHED → ARCHIVED

Validation covers:
- statement consistency
- input/output consistency
- examples
- constraints
- reference solution
- hidden tests
- edge cases
- expected complexity
- Judge execution
- duplicate/similarity checks
- provenance/research metadata
- human review where required

## 8. Judge Engine Boundary
The existing Judge Engine through Phase 15 remains frozen. The Content Factory may integrate with it through a clean interface for reference-solution and test validation. Do not modify Judge Engine code unless separately approved.

## 9. Content Storage
A separate Content/Assessment database or isolated content domain is preferred.

Conceptual areas:
patterns, competencies, problem blueprints, learning problems, assessment problems, problem families, variants, test cases, reference solutions, generation jobs, validation results, review status, provenance metadata, publication history.

Exact physical schema is NOT approved yet.

## 10. Daily Content Factory
Cron is the scheduler/orchestrator, not the generator.
Cron → generation job → candidate creation → validation → review/approval → publish.
Jobs must be idempotent and retry-safe. Invalid content must never auto-publish.

## 11. Version Strategy

### Version 1 — Content Bank
Goal: prove reliable independent problem creation.
Initial target: approximately 500–600 DSA learning problems.
Includes pattern-wise organization, strong validation, separate content storage, manual + AI-assisted authoring, and daily generation foundation.

### Version 2 — Assessment Transformation
Learning problem → Problem DNA → transformation → unfamiliar assessment variant → validation → Mock Assessment Bank.

### Version 3 — Mock Test Engine
Use approved assessment content.

### Version 4 — Company/role interview simulation.

## 12. Scale Strategy
Do not generate 500–600 immediately. First run a 20–30 problem pilot across representative DSA patterns and difficulties.

Measure generation success, validation pass rate, rejection rate, Judge failures, time/cost per approved problem, duplicate/similarity rejection, and difficulty consistency.

Only then scale toward 500–600.

## 13. Version 1 Non-Goals
Do not implement yet:
- complete Mock Test simulation
- company round orchestration
- company-specific simulations
- 2–3 day interview scheduling
- resume-driven rounds
- advanced pattern-transfer scoring
- full transformation engine
- non-DSA content at scale

## 14. Success Gate
Version 1 succeeds only when Sarthi can repeatedly produce high-quality, independently authored problems that are correctly categorized, correctly executable, validated through the intended Judge flow, reviewed, provenance-tracked, and safely published into the Learning Question Bank.

Only after this gate should serious Mock Assessment transformation begin.
