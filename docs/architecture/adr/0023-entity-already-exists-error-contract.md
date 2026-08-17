# ADR 0023: Entity already exists error contract

- Status: Accepted
- Date: 2026-08-17
- Jira: https://gorushkin.atlassian.net/browse/LED-135

## Context

The API previously used several 409 conflict shapes for duplicate entities:
`REGISTRATION_CONFLICT` for duplicate registration and generic `CONFLICT` for
repository-level unique constraint failures such as duplicate account names or
commodity codes.

That forced clients to infer the cause from endpoint context and left race
conditions inconsistent. For example, registration could return
`REGISTRATION_CONFLICT` when the duplicate email was found before insert, but a
generic `CONFLICT` when the unique index rejected a concurrent insert.

Database diagnostics include table names, fields and values. They are useful
for logging, but they are not a safe public API response.

## Decision

Use `ENTITY_ALREADY_EXISTS` for known duplicate entity conflicts.

The public context is an allowlisted shape:

```json
{
  "entityType": "user",
  "field": "email"
}
```

Allowed entity and field pairs are:

- `user.email`
- `account.name`
- `commodity.code`

`REGISTRATION_CONFLICT` is removed from the public error contract. Duplicate
registration now returns `ENTITY_ALREADY_EXISTS` with `user.email`.

Repository unique-constraint diagnostics remain infrastructure details. Known
duplicates are translated at the application boundary through an allowlist
mapper. Unknown `RecordAlreadyExistsError` cases still fall back to generic
`CONFLICT` at the HTTP boundary.

## Alternatives Considered

1. Keep `REGISTRATION_CONFLICT` for registration

- Pros: avoids a response migration for `/auth/register`.
- Cons: keeps duplicate user conflicts different from other duplicate entities
  and does not cover registration race conditions consistently.

2. Return `ENTITY_ALREADY_EXISTS` with generic string fields

- Pros: fewer shared type updates when adding new entities or fields.
- Cons: weakens the public contract and makes it easier to expose persistence
  names accidentally.

3. Map database diagnostics directly in the HTTP error handler

- Pros: centralizes translation in one runtime boundary.
- Cons: makes the HTTP adapter understand persistence tables and fields, and
  risks exposing database diagnostics as API context.

## Consequences

Positive:

- Clients can handle duplicate entities by explicit code and context.
- Registration pre-checks and unique-index races return the same public error.
- Database `value`, table names and internal field names remain private.

Neutral/cost:

- Adding a new public duplicate scenario requires updating the shared contract,
  application allowlist mapper usage and tests.
- Existing clients that expect `REGISTRATION_CONFLICT` must migrate to
  `ENTITY_ALREADY_EXISTS`.

## Related

- [ADR 0008: Structured API error contract](./0008-structured-api-error-contract.md)
- [ADR 0018: Backend HTTP error boundary](./0018-backend-http-error-boundary.md)
- Jira: https://gorushkin.atlassian.net/browse/LED-135
