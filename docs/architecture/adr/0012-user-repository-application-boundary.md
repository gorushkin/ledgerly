# ADR 0012: User repository application boundary

- Status: Superseded
- Date: 2026-07-10
- Jira: https://gorushkin.atlassian.net/browse/LED-91

## Context

`UserRepositoryInterface` exposed `UserDbRow` from `src/db/schema` through
application-level methods used by login and authentication middleware. That made
application and presentation code depend on persistence shape even though
`UserMapper` already owned user DB/domain/API transformations.

Password validation still needs access to the stored password hash, but that
need should not require leaking DB schema types across the application boundary.

## Decision

Password-bearing user repository methods return the domain `User` entity:

1. `getByIdWithPassword(...)` returns `User | undefined`.
2. `getByEmailWithPassword(...)` returns `User | undefined`.
3. `UserRepository` keeps DB rows inside the infrastructure layer and maps them
   through `UserMapper.toDomain(...)` before returning.
4. Login use cases and authentication middleware validate passwords through
   domain behavior such as `User.validatePassword(...)`.
5. `UserDbRow` remains valid inside persistence schema, infrastructure
   repository implementation, and mapper tests, but not in application
   repository contracts or presentation consumers.

## Alternatives Considered

1. Return `UserDbRow` from password-bearing methods.

- Pros: minimal code change.
- Cons: application and presentation layers depend on persistence shape.

2. Return a dedicated `UserWithPassword` application DTO.

- Pros: avoids direct DB row exposure.
- Cons: duplicates the domain entity state and password behavior already
  encapsulated by `User`.

3. Return `UserResponseDTO` plus password hash separately.

- Pros: small explicit data shape.
- Cons: encourages password comparison outside domain behavior and creates a
  security-sensitive ad hoc contract.

## Consequences

Positive:

- DB schema types stay behind the infrastructure boundary.
- `UserMapper` remains the single place for user DB/domain/API transformations.
- Authentication flow uses domain behavior instead of persistence row fields.

Neutral/cost:

- Tests that previously asserted raw `password` fields must validate through
  `User.validatePassword(...)`.
- Future user repository methods that need private persistence fields must
  choose an explicit domain-safe contract instead of returning DB rows.

## Related

- [ADR 0011: Domain entity API conventions](./0011-domain-entity-api-conventions.md)
- Superseded by [ADR 0024: User repository snapshot contract](./0024-user-repository-snapshot-contract.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-91
