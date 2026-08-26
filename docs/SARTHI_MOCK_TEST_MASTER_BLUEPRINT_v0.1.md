# Sarthi Mock Test — Master Blueprint
## Version 0.1 — Living Source of Truth / Discussion Draft

> Status: DISCUSSION DRAFT  
> This document is intentionally versioned and editable. It is the current source of truth for the Mock Test direction. If future discussion changes a product rule, update this document first, then update the implementation plan and Antigravity prompt.

---

# 1. Product Vision

Sarthi Mock Test is not a generic quiz platform.

Its primary objective is:

> **Measure whether a candidate can recognize and apply a familiar competency or algorithmic pattern when it is presented through an unfamiliar problem surface.**

Learning teaches patterns through the normal Sarthi problem bank.

Assessment hides the pattern and changes the presentation.

The system therefore measures **pattern transfer, problem solving, time management, technical depth, and interview readiness**, rather than simple question recall.

---

# 2. Two Modes

## Mode 1 — Sarthi Assessment

Purpose:
- General assessment
- Topic-wise assessment
- Skill-wise assessment
- Custom-scope assessment
- Readiness measurement

Rules:
- Assessment problems must not simply repeat the user's previously solved problems.
- Problems should be unseen at the surface level.
- Existing validated problems may be reused if the user has not encountered them and they fit the assessment.
- If a previously seen problem is needed, prefer meaningful transformation.
- If meaningful transformation is unsuitable, use an appropriate alternative problem testing the same underlying competency/pattern.
- If no suitable problem exists, do not lower the quality bar merely to fill the assessment.

Mode 1 is still an assessment even when the user chooses only one topic.

Example:
User selects:
- Arrays
- Strings
- JavaScript

"Arrays" means the defined Arrays competency scope, not only beginner array questions.

The user may also select explicit sub-scope where appropriate.

---

## Mode 2 — Sarthi Interview Simulation

Purpose:

> Simulate a company's interview process for a specific role and experience level.

User chooses:
- Company
- Role
- Experience
- Optional resume
- Simulation start

Sarthi determines the complete interview structure.

The user cannot:
- Remove rounds
- Skip rounds
- Reorder rounds
- Replace rounds
- Lower round difficulty
- Customize the company's required round structure

If the configured blueprint has 5 rounds, the candidate must attempt all 5.

If the configured blueprint has 3 rounds, the candidate must attempt all 3.

The blueprint determines the simulation.

---

# 3. Company / Role / Experience

Interview Simulation is based on a versioned blueprint:

`Company + Role + Experience + Blueprint Version`

Examples:
- Google + SDE + 0–2 years
- Google + Backend Engineer + 2–5 years
- Atlassian + Frontend Engineer + 2–5 years

Company patterns must be based on reliable/publicly available information and should be described as Sarthi simulations, not confidential or guaranteed replicas of proprietary internal processes.

Blueprints are versioned so historical simulation records remain stable.

---

# 4. Resume Intelligence

Resume upload is optional in Mode 2.

The resume may influence:
- Technical depth
- Technology-specific questions
- Follow-up questions
- Resume-defense questions
- System design context
- Project/experience discussion

Resume information does NOT remove mandatory rounds.

Resume claims are treated as claimed knowledge, not verified knowledge.

Example:
If the resume says:
- Redis
- PostgreSQL
- AWS
- Node.js

Sarthi may probe those areas during relevant technical rounds.

---

# 5. Mandatory DSA Rule

Every Mode 2 Interview Simulation must contain at least one DSA round.

This is mandatory regardless of company or role.

However:
- Difficulty
- Number of problems
- Duration
- Topic distribution
- Reasoning depth

are determined by the company/role/experience blueprint.

Examples:
- Startup Frontend → DSA may be Easy/Medium and shorter.
- Senior Backend → DSA may be Medium with deeper reasoning.
- SDE interview → DSA may be more intensive.

---

# 6. Non-DSA Assessment Domains

Depending on company, role, experience, and blueprint, Sarthi may include:

- DSA
- SQL
- OOP
- Core CS
- System Design
- Machine Coding
- JavaScript
- TypeScript
- React / Frontend
- Node.js / Backend
- API Design
- Database
- Behavioral
- Resume-based Technical
- Other role-specific technical domains

The blueprint determines which rounds exist.

The system must not assume every role needs every domain.

---

# 7. Single Simulation, Multiple Rounds

A Mode 2 simulation is one complete interview simulation.

Example:

Round 1 → Round 2 → Round 3 → Round 4 → Round 5

It is NOT a multi-day learning course.

The simulation can be completed:
- In one sitting
- Across two days
- Across three days

Maximum simulation window: 3 calendar days.

The user may decide to continue later within the permitted simulation window.

---

# 8. Between-Round Breaks

After a completed round, Sarthi provides a transition/break.

Example:
- 10 minutes
- 15 minutes
- 20 minutes
- 30 minutes

The exact available choices may be configurable.

The server is authoritative for all timing.

Do not rely on client-side `setInterval()` or `setTimeout()` as the source of truth.

---

# 9. Continuing Later

After completing a daily batch of rounds, Sarthi can ask:

> Continue now or schedule the next round?

If the user chooses tomorrow:
- Ask for the desired time.
- Create a server-side scheduled continuation.
- Continue the SAME simulation.
- Do not create a new test.

Example:

Day 1:
- Round 1
- Round 2

User schedules:
- Round 3 tomorrow at 10:00 AM

Day 2:
- Round 3
- Round 4

Day 3:
- Round 5

The simulation remains one immutable simulation record.

---

# 10. Attendance and Missed Round

A round may have:
- Scheduled start time
- Attendance window
- Recovery handling for technical interruptions

If the user simply fails to attend the scheduled round within the allowed attendance window:

`Round = MISSED`

and the simulation becomes not-cleared.

A network interruption should not automatically equal failure. Technical recovery should be handled separately.

---

# 11. Failure Does Not Stop the Remaining Rounds

If a candidate fails Round 2:

Round 1 → Passed  
Round 2 → Failed  
Round 3 → Still required  
Round 4 → Still required  
Round 5 → Still required

The candidate completes the complete simulation.

This allows Sarthi to produce a complete performance report.

The final simulation may still be:

`NOT_CLEARED`

but the candidate receives diagnostics for every round.

---

# 12. Round States

Recommended domain states:

- PENDING
- BREAK
- SCHEDULED
- READY
- ACTIVE
- SUBMITTED
- EVALUATING
- PASSED
- FAILED
- MISSED
- EXPIRED
- CANCELLED

Round transitions must be controlled by backend/domain rules.

---

# 13. Simulation Outcomes

Round outcomes:
- PASSED
- FAILED
- MISSED

Simulation outcomes:
- CLEARED
- NOT_CLEARED
- EXPIRED

Do not collapse these into one status.

Example:

Round 1 = PASSED
Round 2 = MISSED
Round 3 = PENDING

Simulation = NOT_CLEARED / EXPIRED according to the applicable rule.

---

# 14. Assessment Problem Intelligence

This is a core subsystem.

Its objective:

> Select an unseen problem surface that measures a relevant competency/pattern.

It is NOT an infinite question generator.

It should use:

1. Existing unseen validated problem
2. Meaningful transformation of an existing problem
3. Suitable alternative problem
4. No problem if quality requirements cannot be satisfied

---

# 15. Existing Sarthi Problem Organization

Current learning organization may contain:

Arena → Topic → Pattern → Problem

Example:

Arrays → Prefix Sum → Subarray Sum Equal K

Arena names such as:
- DSA Phase 1
- DSA Phase 2
- Beginner Phase
- DSA Phase 3

are current learning organization only.

Mock Test architecture must NOT depend on these names.

The durable source is:
- Domain
- Competency
- Pattern
- Difficulty
- Algorithmic technique
- Problem metadata

---

# 16. Canonical Problem / Problem DNA

Every suitable problem should have internal algorithmic metadata.

Example:

Pattern:
Prefix Sum + Frequency Map

Core skill:
Recognize cumulative-state differences

Data structure:
Hash Map

Expected complexity:
O(n)

Difficulty:
Medium

The canonical algorithmic specification is internal.

The candidate must not see:
- Canonical problem identity
- Source lineage
- Hidden pattern
- Pattern label
- Transformation parent

during the assessment.

---

# 17. Problem Transformation Engine

This is a major subsystem.

Goal:

> Preserve the underlying algorithmic/technical pattern while changing the problem surface enough that memorization of the original problem is not sufficient.

The transformation may change:
- Context
- Story
- Terminology
- Input representation
- Output representation
- Examples
- Test cases
- Variable naming
- Constraint presentation
- Operation semantics where safe

The transformation must preserve:
- Intended competency
- Algorithmic invariant
- Required reasoning
- Appropriate difficulty band

Example:

Original:
`Implement a Min-Heap`

Assessment transformation:
A scheduling/resource/processing scenario where the candidate must repeatedly obtain the smallest-priority item while new items arrive.

The user is not told "Min Heap" or "Priority Queue".

---

# 18. Transformation Coverage Goal

We should aim to transform MOST suitable problems, but never force transformation.

Each problem can be classified:

- TRANSFORMABLE
- PARTIALLY_TRANSFORMABLE
- NOT_TRANSFORMABLE

The system should track:
- Total eligible problems
- Successful transformations
- Rejected transformations
- Problems requiring alternatives
- Transformation coverage

Target coverage should be measured empirically after auditing the current bank.

---

# 19. Transformation Decision

For an assessment candidate:

If user has NOT seen the exact problem:
- Use it if it is suitable.

If user HAS seen the exact problem:
1. Attempt meaningful transformation.
2. Validate transformation.
3. If transformation is not suitable, find an alternative problem with the same/appropriate competency.
4. If no quality alternative exists, do not use the problem.

Do not create superficial paraphrases.

Changing only names/story is not sufficient.

---

# 20. Alternative Problem Strategy

Some problems are difficult or unnatural to transform.

Example:
Merge K Sorted Lists.

If transformation quality is poor:
- Do not force transformation.
- Find a suitable alternative testing the relevant underlying competency/pattern.
- Candidate source must be legally usable/licensed/authorized.
- Validate correctness, difficulty, novelty/exposure, and assessment suitability.
- Normalize into Sarthi format.

Do not blindly copy arbitrary web content.

---

# 21. Problem Family / Exposure

Exposure must operate at more than exact question ID.

A user may have seen:
- Original problem
- Transformation Variant A
- Transformation Variant B
- Similar family

Sarthi should maintain problem-family exposure where appropriate.

The objective is to prevent the candidate from receiving a trivially recognizable variant immediately after solving the canonical version.

However, the underlying pattern itself should remain testable.

Example:

Known:
Min Heap canonical problem

Assessment:
Unfamiliar Min Heap transformation

This is desirable.

---

# 22. Pattern Transfer Measurement

This is one of Sarthi's signature metrics.

Example:

Familiar performance:
Min Heap = 92%

Transformed performance:
Min Heap = 61%

Sarthi can infer:

> The candidate performs well on familiar formulations but has difficulty recognizing the pattern when the problem presentation changes.

Possible metrics:
- Pattern recognition
- Problem-solving
- Implementation
- Accuracy
- Time management
- Difficulty handling
- Transfer performance

These metrics must be based on observable evidence and not pretend to be scientifically exact psychological measurements.

---

# 23. Assessment Scope

Mode 1 can be:
- Full
- Topic-wise
- Skill-wise
- Custom

Example:

User chooses:
- Arrays
- Strings
- JavaScript

"Arrays" should mean the defined Arrays competency scope unless the user explicitly chooses a narrower scope.

Example competency hierarchy:

Arrays
- Traversal
- Frequency
- Prefix Sum
- Two Pointer
- Sliding Window
- Hashing
- Intervals
- Matrix
- Other approved array competencies

The exact hierarchy must come from Sarthi's knowledge model, not arena names.

---

# 24. Blind Assessment

During assessment, avoid exposing:
- Pattern name
- Topic name where disclosure would give away the solution
- Canonical source
- Parent problem
- Transformation lineage

The user sees the assessment problem as an interview candidate would.

Post-assessment, Sarthi can explain:
- What pattern was involved
- Whether the candidate recognized it
- Why their approach succeeded/failed

---

# 25. Round Evaluation

Round evaluation should not be only score-based.

Depending on round type, collect relevant dimensions.

For coding:
- Correctness
- Accuracy
- Time
- Attempts
- Compilation failures
- Runtime errors
- Test-case outcomes
- Difficulty handled
- Code quality where measurable

For SQL:
- Query correctness
- Result correctness
- Query efficiency where measurable
- Concept coverage

For system design:
- Requirements
- Architecture
- Scalability
- Reliability
- Data modeling
- Trade-offs
- Communication/structure

For machine coding:
- Functional correctness
- Requirements coverage
- Code structure
- Design quality
- Extensibility
- Test coverage where applicable

The exact rubrics should be designed per assessment type.

---

# 26. Final Result

Successful Mode 2:

> **Congratulations — you cleared the Sarthi Google SDE Interview Simulation.**

Failed:

> **Simulation Not Cleared**

Then show:
- Rounds completed
- Passed/failed/missed rounds
- Overall performance
- Why each failed round failed
- Main strengths
- Main weaknesses
- Recommended next assessment

Do NOT present the complete original question set in history.

---

# 27. Simulation History / Log

History should resemble an interview record.

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
- Readiness/assessment metrics

Do NOT expose:
- Full question text
- Full test reconstruction
- Hidden pattern/source lineage

This also protects assessment integrity.

---

# 28. Existing Judge Engine

Judge Engine Phase 15 is considered a completed capability.

Mock Test should consume the Judge Engine.

Mock Test must not redesign or unnecessarily modify the Judge Engine.

Integration:

Mock Test → Coding Round → Judge Engine → Evaluation → Round Result

The Judge remains an infrastructure subsystem.

---

# 29. No Mandatory Third-Party AI Dependency

The Mock Test platform must not require a third-party LLM API to function.

The Problem Transformation Engine should be designed around:
- Structured problem metadata
- Pattern/DNA
- Transformation rules/recipes
- Deterministic generation where possible
- Test-case generation
- Validation
- Judge verification
- Novelty/exposure checks
- Quality gates

Optional AI/self-hosted models may be considered later for specific tasks, but the core assessment pipeline must remain functional without external AI dependency.

---

# 30. Copyright / Content Safety

Transformation is NOT automatically a copyright-safe mechanism.

Sarthi should:
- Avoid copying protected problem wording
- Avoid copying protected examples/test cases/explanations
- Build transformed problems from internal algorithmic specifications and independently authored content
- Use web-sourced alternatives only when legally usable/licensed/authorized
- Maintain source/license metadata where applicable

---

# 31. Core Product Invariants

1. Sarthi Mock Test is an assessment/simulation system, not a generic quiz.
2. The key capability being measured is pattern transfer.
3. Mode 1 questions must be assessment-grade and should not simply repeat solved problems.
4. Mode 2 company blueprints determine the complete round structure.
5. Users cannot remove or customize required company rounds.
6. Every Mode 2 simulation contains at least one DSA round.
7. Resume influences technical depth/questions, not mandatory round existence.
8. Failed rounds do not stop remaining rounds.
9. Missed scheduled rounds can cause simulation failure.
10. A simulation may span at most three calendar days.
11. Server time is authoritative.
12. Transformation is preferred for previously seen suitable problems.
13. Transformation must be meaningful, not superficial paraphrasing.
14. Difficult-to-transform problems may use suitable alternatives.
15. No low-quality problem should be inserted merely to fill a slot.
16. Candidate-facing assessment must hide pattern/source lineage.
17. Simulation history should show performance/review, not reconstruct the test.
18. Judge Engine Phase 15 remains a separate completed capability.
19. Third-party AI is not a required dependency.
20. This document is versioned and is the current source of truth.

---

# 32. What Is Not Yet Final

The following require further discussion before implementation phases are frozen:
- Exact round pass thresholds
- Exact company blueprint data model
- System Design evaluation rubric
- Machine Coding evaluation model
- SQL/OOP/Core CS assessment formats
- Behavioral round design
- Resume follow-up engine
- Exact 3-day scheduling/attendance rules
- Transformation quality scoring
- Transformation recipe architecture
- Problem similarity/exposure thresholds
- Alternative problem sourcing workflow
- Admin approval workflow
- Readiness score calculation

These should be resolved before declaring Blueprint v1.0 final.
