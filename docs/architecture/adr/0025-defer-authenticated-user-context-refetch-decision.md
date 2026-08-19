# ADR 0025: Defer authenticated user context refetch decision

- Status: Accepted
- Date: 2026-08-19
- Jira: https://gorushkin.atlassian.net/browse/LED-144

## Context

`authMiddleware` currently validates the request token, loads the current user
through `UserRepository.getById(...)`, restores a domain `User`, and stores it
as `request.user`.

While implementing `LED-136`, password change raised a boundary question:
should `ChangeUserPasswordUseCase` re-fetch the current user to get a fresh
password-bearing snapshot, or should it rely on `request.user` from middleware?

Removing the re-fetch now would force a broader decision about the current-user
contract: whether `request.user` is a full domain aggregate, a password-bearing
snapshot, or a lightweight authenticated identity. That decision also affects
`UpdateCurrentUserUseCase` and future version-aware user mutations.

## Decision

For `LED-136`, we intentionally keep the implementation local and do not
redefine the whole current-user boundary.

If password change needs a fresh password-bearing snapshot, it may perform a
local `UserRepository.getById(...)` inside the use case. We will not change
`authMiddleware`, `request.user`, or all user-related use cases as part of the
password-change task.

The broader boundary decision is tracked separately in `LED-144`.

## Alternatives Considered

1. Remove the re-fetch and rely on `request.user`

- Pros: simpler password-change use case.
- Cons: implicitly treats `request.user` as a sufficient password-bearing
  aggregate and spreads a security-sensitive boundary decision into `LED-136`.

2. Replace `request.user` with a new authenticated identity model now

- Pros: clearer long-term boundary between authentication context and domain
  aggregates.
- Cons: requires touching middleware, request typing, user use cases, tests and
  likely future versioning assumptions before the password-change endpoint is
  complete.

3. Keep a local re-fetch for now

- Pros: keeps `LED-136` scoped, avoids changing every current-user flow, and
  leaves the future boundary decision explicit.
- Cons: duplicates a user lookup in the password-change flow until the boundary
  is revisited.

## Consequences

Positive:

- `LED-136` can finish without a cross-cutting user-boundary refactor.
- The duplicate fetch is documented as conscious temporary design debt, not an
  accidental pattern.
- The follow-up decision can consider optimistic locking and version-aware
  updates together with the `request.user` contract.

Neutral/cost:

- Password change may perform one extra user lookup.
- Future user-boundary work must revisit this ADR and `LED-144` before removing
  the re-fetch or changing `request.user`.

## Related

- [ADR 0016: Backend request flow](./0016-backend-request-flow.md)
- [ADR 0024: User repository snapshot contract](./0024-user-repository-snapshot-contract.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-136
- Jira: https://gorushkin.atlassian.net/browse/LED-144
