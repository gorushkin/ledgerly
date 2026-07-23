# ADR 0019: Repository-Enforced Commodity Reference Validation

- Status: Accepted
- Date: 2026-07-23
- Jira: https://gorushkin.atlassian.net/browse/LED-69
- PR: TBD

## Context

ADR 0006 defines Commodity identity and requires accounts and transactions to
reference user-owned Commodities by stable id rather than currency code strings.

There are two possible places to validate those references:

- application use cases can load the referenced Commodity before creating the
  aggregate;
- write repositories can validate the referenced Commodity immediately before
  inserting or updating the row that stores the foreign key.

The account and transaction write paths need the same boundary. Keeping account
validation in the use case while transaction validation lives in the repository
creates an avoidable asymmetry.

## Decision

Commodity reference validation for account and transaction writes is enforced by
write repositories.

Before persisting a new account or transaction, the repository must verify that
the referenced Commodity:

- exists;
- belongs to the same user as the write;
- is not tombstoned.

Use cases remain responsible for request orchestration, aggregate construction,
transaction boundaries and calling repository interfaces. They do not need to
load the Commodity solely to prove that the persistence reference is valid.

Repository checks are part of the repository contract, not a substitute for
request shape validation. HTTP/request schemas still validate that the supplied
Commodity id has the expected UUID shape.

## Alternatives Considered

1. Application-level validation before aggregate creation

- Pros: makes the policy visible in use cases and avoids entering repository
  write paths for invalid references.
- Cons: duplicates repository-side data checks, introduces a time-of-check to
  time-of-use gap and makes account and transaction flows carry Commodity data
  that is not otherwise needed for aggregate behavior.

2. Rely only on database foreign keys

- Pros: smallest implementation.
- Cons: foreign keys do not express same-user ownership or active/tombstone
  policy and produce less intentional error contracts.

3. Repository-enforced validation

- Pros: validates closest to the write, keeps account and transaction write
  paths symmetric and gives repositories one clear contract for Commodity-backed
  persistence references.
- Cons: invalid references reach the repository call, so tests must assert
  stable repository errors rather than expecting use cases to short-circuit.

## Consequences

- `CreateAccountUseCase` and `CreateTransactionUseCase` should not duplicate
  Commodity existence/ownership/tombstone checks solely for reference integrity.
- Account and transaction repositories must keep explicit pre-write checks for
  Commodity ownership and tombstone state.
- Tests for missing, foreign and tombstoned Commodity references belong at the
  repository/write-boundary level, with higher-level tests added only where they
  verify public error mapping or user-visible behavior.
- LED-69 should be read as Commodity-backed write reference validation, not as a
  requirement that failed validation must avoid all repository calls.

## Related

- [ADR 0006: Commodity Registry Before Currency Validation](./0006-commodity-registry-before-currency-validation.md)
- [ADR 0016: Backend Request Flow](./0016-backend-request-flow.md)
- [LED-64: Commodity Registry Epic](https://gorushkin.atlassian.net/browse/LED-64)
- [LED-69: Validate Commodity existence, ownership, and archive state](https://gorushkin.atlassian.net/browse/LED-69)
