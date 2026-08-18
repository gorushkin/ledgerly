# ADR 0024: User repository snapshot contract

- Status: Accepted
- Date: 2026-08-18
- Jira: https://gorushkin.atlassian.net/browse/LED-85

## Context

The user repository was created before the account and commodity repositories
settled on a consistent application boundary. It exposed API DTOs from
`create(...)` and kept multiple id/email lookup methods with overlapping
responsibilities. Authentication also used `getByIdWithPassword(...)`, even
though token-based request authentication only needs to restore the current user
by id, not validate a password.

This made the repository contract harder to compare with newer repositories and
left unused public methods available to new application code.

## Decision

User repository methods should expose persistence-safe application contracts:

1. `create(...)` persists a domain `User` and returns `void`.
2. `getById(...)` returns a `UserSnapshot` or raises the repository not-found
   contract.
3. Request authentication restores the domain `User` from `getById(...)`.
4. `getByEmailWithPassword(...)` remains a domain-returning method because login
   still needs `User.validatePassword(...)`.
5. Unused repository methods such as `getByIdWithPassword(...)`,
   `getProfileById(...)`, `getByEmail(...)`, and `getAll(...)` are removed from
   the public contract.
6. API response DTOs are produced in application mappers and use cases, not in
   the repository.

## Alternatives Considered

1. Keep `getByIdWithPassword(...)` and route auth through it.

- Pros: minimal implementation change.
- Cons: preserves an unnecessary password-bearing path for token auth.

2. Make all user reads return domain `User` entities.

- Pros: simple for callers that need domain behavior.
- Cons: diverges from newer snapshot-oriented repository contracts and exposes
  password-bearing state where only read models are needed.

3. Split a dedicated password DTO from user snapshots.

- Pros: explicit about private credential data.
- Cons: duplicates behavior already owned by the domain `User` for the only
  current password-validation path.

## Consequences

Positive:

- User repository contracts are closer to account and commodity repository
  patterns.
- Registration returns API DTOs from the local domain snapshot after persistence
  succeeds.
- Authentication no longer depends on a password-specific id lookup.
- Removed methods cannot be used accidentally by new use cases.

Neutral/cost:

- ADR 0012 is superseded because password-bearing id lookup is no longer part of
  the accepted boundary.
- Future password-changing use cases must choose an explicit contract based on
  whether they need domain password behavior or only snapshot data.

## Related

- Supersedes [ADR 0012: User repository application boundary](./0012-user-repository-application-boundary.md)
- [ADR 0011: Domain entity API conventions](./0011-domain-entity-api-conventions.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-85
