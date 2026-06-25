# ADR 0006: Asset Registry Before Currency Validation

- Status: Proposed
- Date: 2026-06-20
- Jira: https://gorushkin.atlassian.net/browse/LED-64
- PR: TBD

## Context

LED-47 asks for transaction currency consistency: a transaction currency must be
present and must exist in the system. The current database has a `currencies`
table keyed by currency code, while `accounts.currency` and
`transactions.currency` are plain text fields without foreign keys.

That model is too narrow for the planned Ledgerly domain. Ledgerly needs to
represent fiat currencies, crypto assets, tokenized assets on different
networks, and possibly user-defined assets. In that domain, a display code such
as `USDT` is not a stable primary identifier because the same symbol can exist
on multiple networks or collide with user-defined assets.

## Decision

Do not implement LED-47 as final validation against the existing
`currencies.code` model.

Before enforcing transaction currency existence, introduce or design a broader
asset registry model. The registry should treat fiat currencies as one asset
type rather than the only supported monetary unit.

The future registry should support at least:

- stable asset identity independent of display code;
- asset type, such as `fiat`, `crypto`, `commodity`, or `custom`;
- precision/decimal scale for integer minor-unit storage;
- optional network and contract address for token assets;
- active/disabled state;
- ownership or availability rules for user-defined assets.

Transaction, account, and settings currency references should eventually point
to asset identifiers rather than relying only on text currency codes.

## Alternatives Considered

1. Validate LED-47 against `currencies.code` now

- Pros: small change, closes the immediate task.
- Cons: reinforces a model already known to be insufficient for crypto and
  custom assets; likely requires rework when asset identity is introduced.

2. Add foreign keys from accounts and transactions to `currencies.code`

- Pros: improves relational consistency for the current schema.
- Cons: still assumes ISO-like currency codes are the primary identity and does
  not solve token/network collisions.

3. Keep validation only in request schemas

- Pros: minimal work.
- Cons: does not protect application use cases called outside HTTP and does not
  ensure referenced monetary units exist in the system.

## Consequences

- LED-47 should be deferred or re-scoped until the asset registry decision is
  accepted.
- Short-term validation may continue to check syntactic currency-code shape, but
  should not be treated as final existence validation.
- Future migrations will need to preserve existing `USD`, `EUR`, and similar
  rows as fiat assets.
- Amount validation should eventually use asset precision rather than assuming
  all money has two decimal places.

## Related

- [LED-47: Currency Consistency (MVP)](https://gorushkin.atlassian.net/browse/LED-47)
- [Multicurrency Design](../../MULTICURRENCY_DESIGN.md)
- [Domain Model](../../DOMAIN.md)
- [Database Schema](../../DATABASE_SCHEMA.md)
