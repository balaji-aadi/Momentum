# ANTIGRAVITY MASTER PROMPT — SARTHI CONTENT FACTORY V1

You are now working on the Sarthi Content Factory.

IMPORTANT: The previous Mock Test discussion is temporarily paused. The immediate objective is NOT to build the Mock Test Engine.

The immediate objective is to build the foundation that can create, validate, version, review, and publish Sarthi's own high-quality technical problem bank.

Read:
1. SARTHI_CONTENT_FACTORY_MASTER_BLUEPRINT_v1.0_DRAFT.md
2. SARTHI_CONTENT_FACTORY_VERSION_1_IMPLEMENTATION_PLAN_v1.0_DRAFT.md

## HARD HOLD
Do NOT start coding yet.
Do NOT modify source code, database schemas, routes, APIs, frontend components, Judge Engine files, infrastructure, or production data.

First audit the repository.

## PRODUCT OBJECTIVE
Version 1 focuses on DSA and targets approximately 500–600 high-quality learning problems. Future domains include JavaScript, TypeScript, React, Frontend, Backend, SQL, DBMS, OOP, System Design, DevOps, Cloud, Core CS, Machine Coding, etc.

Mock Tests are downstream.

## CONTENT/COPYRIGHT PRINCIPLE
Do not design around the assumption that rewriting third-party problem statements automatically eliminates copyright risk.

External sites may be used as research/reference for concepts, patterns, difficulty, and competencies. Actual Sarthi content should be independently authored.

Do not claim “copyright-proof” or “zero copyright risk.” Capture provenance/research metadata and support human review. Final commercial content policy should be reviewed by qualified IP counsel.

## TWO BANKS
Learning Question Bank:
- normal practice
- pattern/topic organized
- Sarthi-authored content
- recognizable canonical title may be used where useful
- independently authored statement/examples/tests/explanation

Mock Assessment Bank:
- assessment only
- separate pool
- later version
- unfamiliar presentation
- transformation and pattern-transfer logic comes later

Do not implement the Mock Assessment transformation engine in Version 1.

## AI
AI is OPTIONAL. The architecture must work without a third-party AI API.
AI can assist with candidate problem generation, wording, examples, test ideas, and reference solutions.
AI output must pass Sarthi validation and review.
Manual authoring must remain possible.
Never allow AI → direct production publication.

## PIPELINE
Pattern/Competency
→ Problem Blueprint
→ Candidate Problem
→ Reference Solution
→ Test Cases
→ Validation
→ Review
→ Approval
→ Publication

Lifecycle:
GENERATED → VALIDATING → VALIDATED → REVIEW_REQUIRED → APPROVED → PUBLISHED → ARCHIVED

## JUDGE ENGINE
The existing Judge Engine is at Phase 15 and should remain frozen. Audit how the Content Factory can use it for validation. Do not modify it during this audit.

## DAILY GENERATION
Cron is the scheduler/orchestrator. It triggers generation jobs; it is not the generation intelligence.
Cron → generation job → candidate content → validation → review/approval → publish.
Do not implement this yet.

## AUDIT TASK
Perform a complete repository audit specifically for the Content Factory.

Investigate:
1. Existing problem/question models.
2. Existing pattern/topic taxonomy.
3. Current practice data.
4. User exposure/attempt tracking.
5. Admin/content-management capabilities.
6. Judge Engine integration points.
7. Cron/scheduler infrastructure.
8. Queue/background-job infrastructure.
9. Database conventions.
10. Validation/testing infrastructure.
11. File/storage infrastructure.
12. Authentication/authorization.
13. Analytics/audit logging.
14. Reusable infrastructure.
15. Missing capabilities.
16. Separate content database feasibility.
17. Manual and AI-assisted authoring architecture.
18. Requirements for 500–600 DSA problems.
19. Risks and bottlenecks.
20. Recommended implementation order.

## REQUIRED OUTPUT
Produce:

# SARTHI CONTENT FACTORY — REPOSITORY AUDIT & IMPLEMENTATION PROPOSAL

Include:
1. Current architecture
2. Existing reusable infrastructure
3. Current problem system
4. Current Judge Engine boundary
5. Content Factory gaps
6. Recommended domain architecture
7. Recommended content lifecycle
8. Validation architecture
9. AI-optional authoring architecture
10. Separate content database assessment
11. Cron/queue architecture assessment
12. 20–30 problem pilot strategy
13. 500–600 scale strategy
14. Risks
15. Security considerations
16. Provenance/originality metadata
17. Revised phase order if needed
18. What must NOT be implemented yet
19. Decisions requiring approval

Do not simply repeat the supplied plan. The plan is provisional. If repository evidence indicates a better order or architecture, explain and propose the change.

STOP after the audit and proposal.

Do not modify code.

Wait for explicit approval before implementation.
