# ADR 0015: Domain restoration factory naming

- Status: Accepted
- Date: 2026-07-11
- Jira: https://gorushkin.atlassian.net/browse/LED-81

## Context

Domain value objects, behaviors and entities used two names for the same
restoration operation: `restore(...)` and `fromPersistence(...)`. In domain
code both methods rebuilt objects from persisted/plain state without generating
new identities, timestamps or create-time defaults.

Keeping both names made call sites guess whether the input was persistence
state, a domain snapshot or just a primitive value. It also kept temporary
compatibility aliases in the domain API after the entity convention had already
standardized on `restore(snapshot)`.

## Decision

Domain objects use `restore(...)` for restoration from persisted/plain domain
state. This applies to value objects, behaviors and entities.

Domain objects must not expose `fromPersistence(...)` as a restoration alias.
When the input is a persistence-specific row or relation shape, that conversion
belongs to a mapper or repository boundary outside the domain layer. Such
boundary code may use `fromPersistence(...)` as a mapper method name when the
method input is explicitly persistence-specific, for example DB row to read
model mapping.

`create(...)` remains reserved for new user/application input and may generate
new values or apply create-time normalization/defaults.

## Alternatives Considered

1. Standardize everything on `fromPersistence(...)`.

- Pro: Makes DB origin explicit at some repository call sites.
- Con: Leaks persistence terminology into value objects and entities even when
  the input is a domain snapshot or primitive persisted state.

2. Keep both names as compatibility aliases.

- Pro: Minimal short-term code churn.
- Con: Preserves ambiguous restoration semantics and keeps future call sites
  from knowing which method is canonical.

3. Use `restore(...)` in domain and reserve `fromPersistence(...)` for
   persistence-boundary mappers.

- Pro: Keeps domain naming independent from DB representation while preserving
  precise mapper names where the input shape is actually persistence-specific.
- Con: Requires updating existing call sites and removing compatibility aliases.

## Consequences

- Domain restoration call sites use one canonical method: `restore(...)`.
- Value objects and behaviors no longer carry `fromPersistence(...)`
  compatibility aliases.
- Mapper/repository code must convert persistence rows into domain snapshots or
  read models before calling domain restoration APIs.
- Tests can assert that domain constructable types do not expose
  `fromPersistence(...)` aliases.

## Related

- [ADR 0011: Domain entity API conventions](./0011-domain-entity-api-conventions.md)
- [Domain documentation](../../DOMAIN.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-81
