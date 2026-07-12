# ADR 0017: Backend HTTP adapter boundary

- Status: Accepted
- Date: 2026-07-12
- Jira: https://gorushkin.atlassian.net/browse/LED-86
- PR: TBD

## Context

Backend HTTP code was split between parallel module roots:

- `apps/backend/src/presentation/routes/*`;
- `apps/backend/src/presentation/controllers/*`;
- `apps/backend/src/presentation/middleware/*`;
- `apps/backend/src/presentation/server.ts`;
- `apps/backend/src/interfaces/*` for auth, accounts and transactions HTTP
  controllers/routes.

This made the HTTP layer boundary ambiguous. A route/controller pair could live
under either `presentation` or `interfaces`, and the DI container imported
controllers from both roots.

## Decision

Backend HTTP adapter code lives under:

```text
apps/backend/src/presentation/http/
```

The HTTP adapter owns Fastify server creation, route registration, HTTP routes,
controllers and Fastify middleware. Public access to those modules goes through
`apps/backend/src/presentation/http/index.ts` and feature-level `index.ts`
files.

`apps/backend/src/interfaces` is not used for HTTP code. The `interfaces` name
remains available for application ports such as `application/interfaces`.

HTTP-specific errors and HTTP error translation remain outside this decision.
Their target boundary is tracked separately in LED-106.

## Alternatives Considered

1. Keep `interfaces/*` as the HTTP root.

- Pros: fewer file moves for auth, accounts and transactions.
- Cons: conflicts with `application/interfaces` and keeps the ambiguity that
  caused this decision.

2. Use `adapters/http`.

- Pros: common hexagonal architecture naming.
- Cons: larger terminology shift from the existing `presentation` layer.

3. Keep routes/controllers in separate `presentation/*` folders.

- Pros: small directory changes.
- Cons: keeps HTTP endpoint code scattered across multiple roots and makes DI
  imports less explicit.

## Consequences

Positive:

- HTTP routes, controllers, server and middleware now have one module boundary.
- DI imports HTTP controllers from `src/presentation/http`.
- Tests for HTTP features live next to the feature they exercise.
- `interfaces` no longer has two meanings in backend code.

Neutral/cost:

- Existing imports and tests had to move with the HTTP adapter.
- `presentation/errors` and `libs/errorHandler` still need a separate decision
  if the project wants one fully contained HTTP error boundary.

## Related

- [ADR 0016: Backend request flow](./0016-backend-request-flow.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-86
- Follow-up: https://gorushkin.atlassian.net/browse/LED-106
