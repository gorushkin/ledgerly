# ADR 0018: Backend HTTP error boundary

- Status: Accepted
- Date: 2026-07-13
- Jira: https://gorushkin.atlassian.net/browse/LED-106
- PR: TBD

## Context

ADR 0017 consolidated backend Fastify server creation, route registration,
controllers and middleware under `apps/backend/src/presentation/http`.

HTTP-specific errors and the Fastify error handler remained outside that
boundary:

- `apps/backend/src/presentation/errors/*`;
- `apps/backend/src/libs/errorHandler.ts`.

That left the HTTP adapter split across three module roots. `libs/errorHandler`
was not a neutral library because it depended on Fastify reply semantics,
presentation HTTP errors, status-code mapping and the public API error response
contract.

## Decision

The backend HTTP adapter owns HTTP error translation.

Fastify error handling lives under:

```text
apps/backend/src/presentation/http/error-handler.ts
```

HTTP-specific error classes live under:

```text
apps/backend/src/presentation/http/errors/
```

Public access to the HTTP error boundary goes through
`apps/backend/src/presentation/http/index.ts`.

Domain, application and infrastructure errors remain transport-independent. They
may expose stable API codes and allowlisted context, but they do not carry HTTP
status codes and must not import HTTP presentation errors.

## Alternatives Considered

1. Keep `presentation/errors` and `libs/errorHandler`.

- Pros: fewest file moves.
- Cons: keeps Fastify error translation outside the HTTP adapter and makes
  `libs` depend on presentation concerns.

2. Keep `presentation/errors` but move only `errorHandler`.

- Pros: removes Fastify code from `libs`.
- Cons: leaves HTTP-specific classes outside the HTTP module that consumes them.

3. Move HTTP errors and handler under `presentation/http`.

- Pros: one explicit HTTP adapter boundary for server, routes, middleware and
  error translation; module public API can be enforced through `index.ts`.
- Cons: requires import and documentation updates.

## Consequences

Positive:

- HTTP error translation has one owner: `presentation/http`.
- `libs` no longer contains Fastify-specific response code.
- HTTP-specific errors are colocated with HTTP middleware and the error handler.
- Public HTTP module imports can go through `src/presentation/http`.

Neutral/cost:

- Tests and imports moved with the error boundary.
- Documentation has to distinguish transport-independent coded errors from
  HTTP-specific `HttpApiError` subclasses.

## Related

- [ADR 0008: Structured API error contract](./0008-structured-api-error-contract.md)
- [ADR 0017: Backend HTTP adapter boundary](./0017-backend-http-adapter-boundary.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-106
