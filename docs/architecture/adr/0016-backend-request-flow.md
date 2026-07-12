# ADR 0016: Backend request flow

- Status: Accepted
- Date: 2026-07-12
- Jira: https://gorushkin.atlassian.net/browse/LED-84
- PR: TBD

## Context

Backend HTTP endpoints currently use more than one application flow:

- auth, accounts and transactions mostly follow
  `route -> controller -> use case -> repository/domain`;
- user profile routes are registered but still throw `Not implemented`;
- legacy `src/services/user.service.ts` exists outside the application use case
  structure;
- HTTP routes are split between `presentation/routes` and `interfaces/*`;
- some application code still depends on DTO, DB schema or concrete
  infrastructure types.

Without a documented request flow, new backend work has to guess whether a
business operation belongs in a route handler, controller, service or use case.

## Decision

New HTTP endpoint work must follow this flow:

```text
Fastify route -> controller -> application use case -> repository/domain
```

Responsibilities:

1. Route

- Owns Fastify route binding, URL shape and HTTP method registration.
- Reads authenticated request context such as `request.user`.
- Parses route params and query strings when doing so is just transport
  extraction.
- Sets transport-only response status for simple cases such as `201 Created`
  and `204 No Content`.
- Does not contain business rules, repository calls or domain mutation logic.

2. Controller

- Orchestrates request and response concerns that need Fastify objects, such as
  body validation when the validation schema is tied to the HTTP request body,
  JWT signing and response envelope assembly.
- Calls exactly one primary application use case per endpoint operation unless
  a documented exception is needed for composition.
- Does not access repositories directly and does not implement business rules.

3. Use case

- Owns one application operation.
- Coordinates domain entities, application policies, repository interfaces,
  transaction boundaries and application services.
- Performs authorization and ownership checks that are part of the application
  operation.
- Returns application-safe DTOs or read models; it must not return DB rows.

4. Mapper

- Owns conversion between domain snapshots, application read models, response
  DTOs and persistence shapes.
- Persistence mapping belongs at the infrastructure boundary unless an existing
  documented exception is being migrated.
- Domain entities must not expose HTTP or persistence DTO methods.

5. Repository

- Owns persistence access and DB-specific query/update behavior.
- Implements application repository interfaces where a boundary exists.
- Does not create public API response contracts directly.

6. Application services

- `apps/backend/src/application/services/*` may exist as helper orchestration
  used by use cases, for example factories or context loaders.
- Root-level `apps/backend/src/services/*` is legacy. New endpoint operations
  must not be added there.
- If an operation is exposed through HTTP, the primary application boundary is a
  use case, not a generic service class.

Validation placement:

- Request body, params and query validation may happen in route or controller
  during the migration period, but each endpoint group should pick one local
  pattern and keep it consistent.
- Normalized application invariants belong in use cases or domain objects, not
  in route handlers.

JWT and authentication:

- Authentication middleware restores the authenticated user context.
- Login/register controllers may sign JWTs because signing requires the
  Fastify reply adapter.
- Use cases return authenticated user data but do not depend on Fastify or JWT
  APIs.

Transaction boundaries:

- Use cases choose transaction boundaries for application operations.
- Repositories and transaction managers implement those boundaries; routes and
  controllers do not start persistence transactions directly.

## Alternatives Considered

1. Keep both service-layer and use-case-layer endpoint flows.

- Pros: minimal short-term movement for legacy user profile code.
- Cons: keeps the main ambiguity that caused this decision; new endpoint work
  still has no stable target.

2. Move business logic directly into route handlers.

- Pros: simple for small endpoints.
- Cons: couples business operations to Fastify, makes testing harder and
  duplicates behavior between transport adapters.

3. Make controllers the application operation boundary.

- Pros: fewer classes than one use case per operation.
- Cons: controllers then mix HTTP orchestration with business coordination,
  repository access and transaction concerns.

4. Treat `application/services/*` as the primary endpoint layer.

- Pros: common enterprise naming.
- Cons: conflicts with current auth/accounts/transactions use case structure
  and does not distinguish helper services from endpoint operations.

## Consequences

Positive:

- New endpoint work has one target structure and one primary application
  boundary.
- Legacy root services can be removed without renaming useful
  `application/services` helpers.
- Fastify-specific code stays near routes/controllers while use cases remain
  transport-independent.
- Repository and mapper boundaries align with ADR 0011 and ADR 0012.

Neutral/cost:

- Existing user and currency stubs need migration or removal tasks.
- Route/controller validation is not fully uniform yet; it is tracked as
  follow-up work.
- Some application mappers and use cases still need cleanup to remove
  persistence and infrastructure coupling.

## Related

- [ADR 0001: Transaction repository boundaries](./0001-transaction-repository-boundaries.md)
- [ADR 0008: Structured API error contract](./0008-structured-api-error-contract.md)
- [ADR 0011: Domain entity API conventions](./0011-domain-entity-api-conventions.md)
- [ADR 0012: User repository application boundary](./0012-user-repository-application-boundary.md)
- [ADR 0017: Backend HTTP adapter boundary](./0017-backend-http-adapter-boundary.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-84

Follow-up deviations:

- `LED-85`: migrate user profile endpoints from legacy service to use cases.
- `LED-86`: consolidate backend presentation and interfaces modules
  (resolved by ADR 0017).
- `LED-87`: standardize route and controller responsibilities.
- `LED-88`: decouple use cases from infrastructure types.
- `LED-90`: move persistence mapping out of application mappers.
- `LED-105`: define or remove currencies HTTP endpoint stub.
