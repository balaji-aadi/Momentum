# ADR-004: Provider Architecture & Capability Scoring

- **Status**: ACCEPTED
- **Date**: 2026-07-30
- **Authors**: Sarthi Core Engineering Team

## Context
Static mapping tables (`TreeNode -> BalancedTreePlugin`) required updating core registry files whenever a new data structure plugin was added, violating the Open-Closed Principle.

## Decision
We replace static hardcoded maps with **Capability-Driven Provider Interfaces**. All plugins implement self-describing metadata and a `supports(ir) -> score` method. The `ProviderRegistry` dynamically queries registered plugins and selects the highest-scoring provider ($0.0$ to $1.0$).

## Alternatives Considered
- *Hardcoded string registries*: Rejected due to tight coupling and poor extensibility.

## Consequences
- New data structures, grammars, and custom nodes can be supported simply by registering provider classes.
- Zero modifications to core compiler or runtime logic.
