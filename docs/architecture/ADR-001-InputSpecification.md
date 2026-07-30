# ADR-001: InputSpecification Layer as Single Source of Truth

- **Status**: ACCEPTED
- **Date**: 2026-07-30
- **Authors**: Sarthi Core Engineering Team

## Context
Historically, problem creation separated numerical text constraints from input types. Numerical text constraints (`1 <= s.length <= 30`) describe bounds but cannot express structural grammar (`3[a2[c]]`), pointer schemas (`Node.random`), or graph invariants (BST, DAG). As a result, low-level judge settings were manually configured per problem.

## Decision
We establish **`InputSpecification`** as the canonical Single Source of Truth for problem inputs. All compiler stages, registries, UI forms, and test generators derive directly from `InputSpecification`.

We separate `InputSpecification` into two orthogonal sub-specifications:
1. **`StructuralSpecification`**: WHAT the input is (Primitive, Array, Matrix, Tree, Graph, Custom Schema, Context-Free Grammar).
2. **`ValidationSpecification`**: WHAT bounds apply (length limits, min/max values, max recursion depth).

## Alternatives Considered
- *Inferring everything from text constraints*: Rejected due to ambiguity and inability to express context-free grammars or pointer graphs.
- *Manual plugin configuration per problem*: Rejected due to author friction and fragility.

## Consequences
- Single source of truth across all pipeline stages.
- Generator plugins first synthesize a valid structural topology, then enforce numerical validation bounds.
- Zero hardcoding of problem titles in judge logic.
