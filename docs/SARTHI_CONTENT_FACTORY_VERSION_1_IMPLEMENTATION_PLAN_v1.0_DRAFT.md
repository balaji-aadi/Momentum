# SARTHI CONTENT FACTORY — VERSION 1 IMPLEMENTATION PLAN v1.0-DRAFT

## CF-0 — Repository Audit
Audit current problem architecture, practice database, exposure/progress, Judge Engine Phase 15 boundary, admin tooling, cron/queues, storage, auth, analytics, and tests.
**No code changes.**
Gate: audit + revised proposal approved.

## CF-1 — Content Domain Design
Define Problem Blueprint, Problem DNA, Learning Problem, Pattern/Competency taxonomy, Problem Family, Test Case, Reference Solution, Generation Job, Validation Result, Review/Publication status, and Provenance metadata.
Do not finalize physical schema before review.
Gate: domain model approved.

## CF-2 — Problem Authoring Contract
Define required fields: title, statement, input, output, constraints, examples, edge cases, expected complexity, reference solution, tests, explanation, tags/pattern, provenance.
Define independent-authoring and research rules.
Gate: authoring contract approved.

## CF-3 — Generation Pipeline
Support manual and AI-assisted authoring, candidate storage, versioning, retries, idempotency, and job tracking.
AI remains optional.
Gate: candidates can be created without touching production.

## CF-4 — Validation Pipeline
Validate content consistency, examples, constraints, reference solution, tests, edge cases, Judge execution, practical complexity checks, duplicate/similarity signals, and provenance.
Gate: invalid content is quarantined/rejected.

## CF-5 — Judge Integration
Integrate with the existing Judge Engine through an approved interface. Do not unnecessarily modify Judge Engine.
Gate: representative problems pass end-to-end validation.

## CF-6 — Review & Publishing
Lifecycle: GENERATED → VALIDATING → VALIDATED → REVIEW_REQUIRED → APPROVED → PUBLISHED.
Maintain audit/rejection history.
Gate: only approved content reaches the Learning Bank.

## CF-7 — 20–30 Problem Pilot
Cover arrays, hashing, sliding window, two pointers, binary search, heap, trees, graphs, DP, and other representative patterns.
Measure quality, failure, rejection, cost, and consistency.
Gate: agreed quality threshold.

## CF-8 — Scale to 500–600
Expand after pilot approval. Maintain pattern coverage, validation gates, review, and monitoring.

## CF-9 — Daily Content Factory
Cron → job → generation → validation → review/approval → publish.
Requirements: idempotency, retry safety, failure isolation, observability, and no invalid auto-publication.

## CF-10 — Version 1 Review
Review content quality, bank coverage, generation cost, AI optionality, validation accuracy, operational reliability, and provenance workflow.
Then design Version 2 transformation.

## Explicit Hold
Do not begin Mock Test Engine, Mock Bank transformation, company simulations, resume-driven rounds, or advanced transformation until Version 1 success is demonstrated.
