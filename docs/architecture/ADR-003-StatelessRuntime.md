# ADR-003: Stateless Judge Runtime

- **Status**: ACCEPTED
- **Date**: 2026-07-30
- **Authors**: Sarthi Core Engineering Team

## Context
Stateful judge workers that maintain dynamic caches, active plugin registries, or shared memory introduce scaling bottlenecks and risk memory leak contamination between user submissions.

## Decision
The Sarthi Judge Runtime is **100% Stateless**. Workers load sealed `ProblemPackage` assets, execute submissions inside isolated VM sandboxes, issue verdicts, and immediately discard all execution state.

## Alternatives Considered
- *In-memory stateful judge caching*: Rejected due to cross-submission state leaks and cluster synchronization overhead.

## Consequences
- Unlimited horizontal scaling across thousands of independent worker pods.
- Zero inter-submission memory leaks.
