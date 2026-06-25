# ADR 0010: Entity not found API code

- Status: Accepted
- Date: 2026-06-24
- Jira: N/A
- PR: TBD

## Context

ADR 0009 standardized repository misses as `ENTITY_NOT_FOUND` with an
allowlisted `{ entityType, entityId? }` context. The public error contract
also contained the generic `NOT_FOUND` code, which was reachable only through
`HttpApiError(404)` and carried no entity context. This exposed two not-found
codes for the same client-visible condition.

## Decision

Remove `NOT_FOUND` from the public API contract and prohibit
`HttpApiError(404)`. Known missing entities must use a coded error with
`ENTITY_NOT_FOUND` and its allowlisted context.

## Alternatives Considered

1. Retain `NOT_FOUND` for generic route-level 404 responses.

- Pros: a generic 404 code remains available.
- Cons: clients must branch on two not-found codes, while `HttpApiError` has
  no entity context to distinguish them reliably.

2. Map `HttpApiError(404)` to `ENTITY_NOT_FOUND`.

- Pros: one not-found code.
- Cons: it violates the required `ENTITY_NOT_FOUND` context contract because
  a generic HTTP error has no `entityType`.

## Consequences

- API consumers use `ENTITY_NOT_FOUND` for missing entities.
- Presentation code cannot create a generic 404 through `HttpApiError`.
- Route-level 404 behavior is outside this error contract unless a dedicated,
  typed route-not-found error is introduced later.

## Related

- [ADR 0008: Structured API error contract](./0008-structured-api-error-contract.md)
- [ADR 0009: Repository error-code migration](./0009-repository-error-code-migration.md)
