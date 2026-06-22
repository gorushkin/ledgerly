# ADR 0008: Structured API error contract

- Status: Accepted
- Date: 2026-06-21
- Jira: https://gorushkin.atlassian.net/browse/LED-72
- PR: TBD

## Context

Backend errors currently use `Error.message` as their public HTTP response.
Entity names are also passed as raw strings at error call sites. This makes
messages an accidental API contract, allows inconsistent casing, and leaves a
client without stable data for localization or field-level handling.

The domain and application layers must not depend on HTTP, while the
presentation layer needs a uniform, safe response format.

## Decision

1. Each externally represented error has a stable `SCREAMING_SNAKE_CASE`
   `code` and a typed `context` whose shape is determined by that code.
2. API error responses for coded errors contain `error`, `code`, and safe
   `context`. They do not expose the backend `message`.
3. `message` remains a developer-facing diagnostic detail for logs, stack
   traces, and local debugging; it is not a UI or API contract.
4. Each domain entity exposes one lowercase singular `entityType` technical
   identifier, such as `transaction`, `operation`, or `account`. Errors use
   this identifier instead of raw entity-name strings.
5. The presentation layer centrally maps error codes to HTTP statuses. Domain
   and application errors do not carry HTTP-specific status information.
6. Public error context is an explicit allowlist. Internal diagnostic details
   that are unsafe or unnecessary for a client are kept out of it.
7. Presentation adapters translate external validation errors, including
   `ZodError`, into the same contract. The API exposes `VALIDATION_FAILED` and
   normalized field codes, not Zod issue details or messages.
8. Authentication failures use one `AUTHENTICATION_FAILED` response with an
   empty context whether the account is absent or the password is invalid.
   Internal error messages may retain the cause for diagnostics, but are never
   serialized. Registration conflicts use the stable `REGISTRATION_CONFLICT`
   code with an empty context.

## Alternatives Considered

1. Keep `message` as the API contract

- Pros: no response migration.
- Cons: brittle assertions, no localization boundary, and wording/casing become
  backwards-compatibility concerns.

2. Add only `entityType` and keep textual API messages

- Pros: removes duplicate entity strings.
- Cons: does not establish stable machine-readable semantics or context for
  clients.

3. Store HTTP status in every domain or application error

- Pros: localizes each error's transport mapping.
- Cons: couples domain/application layers to HTTP and makes future transport
  adapters harder to introduce.

## Consequences

Positive:

- Frontend and future clients can localize and handle errors using stable codes
  and typed context.
- Entity naming has one technical source of truth.
- Error-message wording can evolve without breaking clients.

Neutral/cost:

- New coded errors require a code, a public context schema, and a presentation
  status mapping.
- Validation-library upgrades do not change the API contract; the Zod adapter
  must map any new issue types deliberately.
- Existing textual error responses must be migrated deliberately; the first
  migration is limited to the transaction application flow and selected domain
  errors in `LED-72`.

## Related

- [LED-72: Unify entity identifiers in domain errors](https://gorushkin.atlassian.net/browse/LED-72)
- [LED-74: Define secure auth error API contract](https://gorushkin.atlassian.net/browse/LED-74)
- [ADR 0002: Operation application boundary](./0002-operation-application-boundary.md)
