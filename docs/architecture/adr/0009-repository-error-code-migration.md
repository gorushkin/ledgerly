# ADR 0009: Repository error-code migration

- Status: Accepted
- Date: 2026-06-24
- Jira: https://gorushkin.atlassian.net/browse/LED-75
- PR: TBD

## Context

`RepositoryNotFoundError` previously reached the HTTP boundary through a
legacy mapping and produced `NOT_FOUND` with an empty context. Repository
access failures did not have an equivalent stable coded contract. LED-75
migrates expected repository failures to `CodedInfrastructureError` so their
responses conform to ADR 0008.

## Decision

`RepositoryNotFoundError` returns HTTP 404 with `ENTITY_NOT_FOUND` and an
allowlisted `{ entityType, entityId? }` context. `ForbiddenAccessError`
returns HTTP 403 with `UNAUTHORIZED_ACCESS` and the same allowlisted context.

This is a breaking public API change for clients that branch on the legacy
`NOT_FOUND` code. No compatibility alias or dual-code response is provided:
clients must accept the new code before consuming the migrated repository
endpoints.

## Alternatives Considered

1. Retain `NOT_FOUND` with an empty context.

- Pros: preserves the existing response code.
- Cons: repository failures do not share the typed entity contract used by
  domain and application errors.

2. Return both legacy and new codes.

- Pros: eases client migration.
- Cons: creates an ambiguous API contract and extends legacy support without a
  versioning policy.

## Consequences

- API consumers must treat `ENTITY_NOT_FOUND` as the not-found code for
  migrated repository paths and `UNAUTHORIZED_ACCESS` as the access-denied
  code.
- The API never exposes repository messages, database diagnostics, or other
  non-allowlisted data in these responses.
- Any future compatibility layer must be explicit, versioned, and tested.

## Related

- [LED-75: Translate infrastructure failures to safe API error codes](https://gorushkin.atlassian.net/browse/LED-75)
- [ADR 0008: Structured API error contract](./0008-structured-api-error-contract.md)
