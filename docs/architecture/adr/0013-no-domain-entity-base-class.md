# ADR 0013: No DomainEntity base class

- Status: Accepted
- Date: 2026-07-10
- Jira: https://gorushkin.atlassian.net/browse/LED-10
- PR: TBD

## Context

`LED-10` proposed a shared `DomainEntity` abstraction for common entity
properties. The domain layer already uses reusable behavior objects:
`EntityIdentity`, `EntityTimestamps`, `SoftDelete`, `ParentChildRelation` and
`Version`.

Current entities do not share one uniform capability set:

- `User` has identity and timestamps, but no soft delete or ownership behavior.
- `Account` has identity, timestamps, soft delete and user ownership.
- `Operation` has identity, timestamps, soft delete, user ownership, transaction
  relation and account relation.
- `Transaction` is an aggregate root with identity, timestamps, soft delete,
  ownership, versioning and operation invariants.

Forcing these shapes into one base class would either make the base class too
small to be useful or too broad to model all entities honestly.

## Decision

Do not introduce an abstract `DomainEntity` base class.

Domain entities continue to use behavior composition. Shared behavior belongs
in focused components such as `EntityIdentity`, `EntityTimestamps`,
`SoftDelete`, `ParentChildRelation` and `Version`.

Do not introduce capability interfaces preemptively. Interfaces such as
`SnapshotEntity`, `SoftDeletableEntity` or `UserOwnedEntity` may be added later
only when a concrete generic consumer needs that contract.

Entity API conventions remain governed by
[ADR 0011](./0011-domain-entity-api-conventions.md): `create(...)`,
`restore(snapshot)` and `toSnapshot()` are conventions, not inherited base
methods.

## Alternatives Considered

1. Add a minimal `DomainEntity` with identity and timestamps.

- Pros: removes a small amount of delegation code.
- Cons: excludes valid entities without timestamps and does not help with soft
  delete, ownership, versioning, aggregate invariants or snapshots.

2. Add a broad `DomainEntity` with identity, timestamps, soft delete, ownership
   and versioning hooks.

- Pros: makes entities look uniform at first glance.
- Cons: makes the base class dishonest for entities that do not support every
  capability and couples unrelated lifecycle concerns.

3. Add capability interfaces now.

- Pros: documents optional capabilities structurally.
- Cons: adds abstraction without a current generic consumer. TypeScript already
  checks concrete method shapes where they are used.

## Consequences

Positive:

- Entity behavior remains explicit in each entity constructor.
- Domain model keeps composition over inheritance as the default rule.
- New shared abstractions must be justified by actual reuse.

Neutral/cost:

- Entities keep small delegation methods such as `getId()` and `isDeleted()`.
- Cross-entity generic code will need a focused interface if it appears later.

## Related

- [ADR 0011: Domain entity API conventions](./0011-domain-entity-api-conventions.md)
- [Domain core README](../../../apps/backend/src/domain/domain-core/README.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-10
