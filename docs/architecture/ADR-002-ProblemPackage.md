# ADR-002: Immutable ProblemPackage Artifact

- **Status**: ACCEPTED
- **Date**: 2026-07-30
- **Authors**: Sarthi Core Engineering Team

## Context
Executing problems dynamically at runtime required querying registries, running inference engines, and synthesizing testcases per submission. This introduced runtime latency and caused historical submissions to break whenever underlying plugin implementations changed.

## Decision
We elevate compiled problems into **`ProblemPackage`** — immutable, self-contained, SHA-256 signed executable assets. Everything required to run, test, and evaluate a problem (metadata, specs, pre-computed test suites, reference outputs, plugin bindings, execution limits) lives inside this package.

## Alternatives Considered
- *Dynamic runtime generation*: Rejected due to latency and historical submission fragility.
- *Unsigned JSON payloads*: Rejected due to risk of unauthorized payload tampering.

## Consequences
- $O(1)$ lookup time for judge execution.
- 100% historical immutability; published packages never break when codebase plugins are upgraded.
