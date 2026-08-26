# Sarthi Mock Test — Implementation Phase Plan
## Version 0.1 — Derived from Master Blueprint v0.1

> Status: DISCUSSION DRAFT  
> This plan is NOT the final implementation plan yet. Product rules may change during discussion. The Master Blueprint is the source of truth.

---

# Phase MT-0 — Repository Audit & Architecture Baseline

## Goal
Understand the existing Sarthi architecture before changing code.

Audit:
- Current CMS/question schema
- Topic/pattern/problem relationships
- User/problem attempt history
- Existing authentication
- Existing Judge Engine Phase 15 integration points
- Existing frontend architecture
- Existing backend architecture
- Database conventions
- Event/queue infrastructure if present
- Existing analytics
- Existing scheduling capabilities

Deliverables:
- Current-state architecture
- Reusable components
- Gaps
- Risks
- Recommended integration boundaries

IMPORTANT:
No feature implementation before this audit is reviewed.

---

# Phase MT-1 — Mock Test Domain Foundation

Build the core domain independently from current Arena names.

Core concepts:
- Assessment
- Assessment Blueprint
- Assessment Scope
- Simulation
- Interview Blueprint
- Round
- Round Type
- Round Result
- Simulation Result
- Simulation Schedule
- Break/Transition
- Attendance Window
- Assessment Problem
- Problem Family
- Problem Exposure

Establish state machines and invariants.

---

# Phase MT-2 — Assessment Blueprint Engine

Support Mode 1 and Mode 2 configuration.

Mode 1:
- Full assessment
- Topic/skill assessment
- Custom scope
- Difficulty
- Duration

Mode 2:
- Company
- Role
- Experience
- Versioned interview blueprint
- Mandatory DSA
- Role-specific domains
- Round sequence
- Round duration
- Evaluation configuration

No UI polish before domain behavior is stable.

---

# Phase MT-3 — Assessment Problem Intelligence Foundation

Build:
- Problem DNA metadata
- Competency/pattern mapping
- Problem family
- Transformation eligibility
- User exposure
- Assessment suitability

Do NOT generate transformations yet.

First establish the data model and exposure logic.

---

# Phase MT-4 — Problem Transformation Engine

Core goal:

Transform most suitable previously seen problems into unfamiliar assessment surfaces while preserving the intended algorithmic pattern.

Build:
- Transformation recipes
- Context transformation
- Input/output transformation
- Constraint transformation
- Example generation
- Test-case generation
- Transformation quality checks
- Transformation lineage
- Pattern invariants

Do not use superficial paraphrasing.

---

# Phase MT-5 — Problem Validation & Quality Gate

Every transformed problem must pass validation.

Pipeline:

Candidate
→ structural validation
→ solution validation
→ test generation
→ Judge validation
→ pattern/invariant validation
→ difficulty validation
→ similarity/novelty validation
→ quality gate

Failed candidates never enter production assessment pools.

---

# Phase MT-6 — Alternative Problem Discovery

Fallback for problems that cannot be meaningfully transformed.

Build:
- Pattern-based alternative discovery
- Allowed/licensed source handling
- Source metadata
- Difficulty matching
- Exposure checking
- Normalization
- Validation

Do not copy arbitrary web content.

---

# Phase MT-7 — Mode 1 Assessment Runtime

Build:
- Assessment creation
- Scope selection
- Problem selection
- Unseen problem policy
- Timer
- Autosave
- Question navigation
- Submission
- Evaluation
- Result generation

Support topic-wise assessments.

---

# Phase MT-8 — Mode 2 Interview Simulation Runtime

Build:
- Company selection
- Role selection
- Experience selection
- Blueprint loading
- Simulation creation
- Round sequencing
- Mandatory round enforcement
- Round state machine
- Pass/fail recording
- Continue-after-failure behavior

---

# Phase MT-9 — Break, Scheduling & 3-Day Continuation

Build:
- Between-round breaks
- User-selected break duration
- Daily continuation
- Schedule next round
- Server-side timing
- Attendance window
- Missed round
- Expiration
- Maximum three-calendar-day rule
- Recovery for technical interruptions

---

# Phase MT-10 — Judge Integration

Connect coding rounds to the completed Judge Engine.

Flow:

Simulation
→ Coding Round
→ Existing Judge Engine
→ Submission Result
→ Round Evaluation

Do not expand Judge Engine scope unless an integration gap requires it.

---

# Phase MT-11 — Non-DSA Assessment Types

Implement assessment-specific runtimes/rubrics for:
- SQL
- OOP
- Core CS
- System Design
- Machine Coding
- JavaScript
- Frontend
- Backend
- Behavioral
- Other role-specific domains

Each should have an explicit evaluation contract.

Do not force every domain into MCQ format.

---

# Phase MT-12 — Resume Intelligence

Build:
- Resume upload
- Text extraction
- Skill/technology extraction
- Experience/project extraction
- Resume claim map
- Technical depth selection
- Resume-defense questions
- Follow-up question model

Resume modifies depth/questions but cannot remove mandatory DSA or blueprint-required rounds.

---

# Phase MT-13 — Performance & Diagnostic Engine

Calculate:
- Round score
- Accuracy
- Time efficiency
- Difficulty handling
- Pattern transfer
- Problem-solving indicators
- Domain-specific metrics

Generate:
- Why failed
- Strengths
- Weaknesses
- Repeated failure patterns
- Recommended next assessment

Avoid pretending readiness scores are scientifically exact.

---

# Phase MT-14 — Simulation History & Review

Build immutable simulation records.

History shows:
- Company
- Role
- Blueprint version
- Date
- Duration
- Round outcomes
- Performance
- Failure reasons
- Review

Do not expose full test reconstruction or question bank history.

---

# Phase MT-15 — Company Blueprint Library

Create versioned company/role blueprints based on reliable public information.

Start with a small set of carefully researched companies/roles.

Do not attempt hundreds of companies initially.

Each blueprint should define:
- Rounds
- Order
- Duration
- Required domains
- DSA requirements
- Difficulty
- Evaluation criteria

---

# Phase MT-16 — End-to-End Simulation Hardening

Test:
- Browser refresh
- Network interruption
- Reconnect
- Multiple tabs
- Timer drift
- Scheduled continuation
- Missed round
- Failed round continuation
- Duplicate submission
- Concurrent actions
- Expiration
- Recovery
- Data consistency

Run full regression against Judge Engine integration.

---

# Phase MT-17 — Assessment Integrity & Security

Protect:
- Problem lineage
- Hidden pattern metadata
- Question pool
- Transformation variants
- User exposure data
- Blueprint configuration
- Simulation state

Prevent:
- Repeated problem leakage
- Client-side timer manipulation
- Round skipping
- Unauthorized rescheduling
- Question regeneration abuse
- Duplicate attempts

---

# Phase MT-18 — Admin / CMS Transformation Operations

Admin tools for:
- View transformation coverage
- Review candidate transformations
- Approve/reject
- Inspect lineage
- Inspect validation results
- Mark transformability
- Manage alternative sources
- Manage company blueprints
- Version blueprints

---

# Phase MT-19 — Final Product UX

Only after domain behavior is stable:
- Mode selection
- Assessment setup
- Company/role setup
- Resume upload
- Simulation lobby
- Round screen
- Break screen
- Schedule continuation
- Final result
- Performance review
- Simulation history

UX should communicate a professional interview simulation, not a casual quiz.

---

# Phase MT-20 — Production Readiness

Final checks:
- Load testing
- Data integrity
- Failure recovery
- Observability
- Metrics
- Audit logs
- Security
- Cost analysis
- Problem pool capacity
- Transformation pool capacity
- Judge integration capacity

No production release until the full simulation lifecycle is verified.

---

# Phase Dependencies

MT-0
→ MT-1
→ MT-2
→ MT-3
→ MT-4
→ MT-5

Then:

MT-6
→ MT-7
→ MT-8
→ MT-9
→ MT-10

Parallel/after foundation:
MT-11
MT-12
MT-13
MT-14
MT-15
MT-18

Finally:
MT-16
→ MT-17
→ MT-19
→ MT-20

---

# Important Implementation Rule

Do not implement all phases blindly.

After each phase:
1. Verify against the Master Blueprint.
2. Run tests.
3. Audit downstream impact.
4. Record decisions.
5. Update documentation if the approved product behavior changes.
6. Only then continue.

The phase plan is subordinate to the latest approved Master Blueprint.
