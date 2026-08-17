# ADR 0006: Commodity Registry Before Currency Validation

- Status: Accepted
- Date: 2026-07-15
- Jira: https://gorushkin.atlassian.net/browse/LED-65

## Context

LED-47 asks for transaction currency consistency: a transaction currency must be
present and must exist in the system. At the time of this decision, the database
had a `currencies` table keyed by currency code, while `accounts.currency` and
`transactions.currency` were plain text fields without foreign keys.

That model is too narrow for the planned Ledgerly domain. Ledgerly is inspired
by GnuCash, where monetary units are modeled as commodities. Fiat currencies are
commodities, but the same abstraction can also represent crypto assets,
tokenized assets, points, or user-defined units.

In this domain, a display code such as `USD` or `USDT` is not stable identity:
codes can be edited by the user, can collide across users, and can collide
across networks or custom assets. Ledgerly also needs a path to user-created and
user-edited monetary units, so `Currency` should not remain a closed value
object with predefined values.

## Decision

Do not implement LED-47 as final validation against the existing
`currencies.code` model. Introduce a user-owned Commodity Registry first.

`Commodity` is the backend/domain term for a monetary unit. Product copy and UI
may still use words such as currency, asset, or unit where that is clearer for a
user, but domain code should converge on Commodity.

The Commodity model is:

- each Commodity has a stable `id` and `userId`;
- Commodity identity is `id`, not `code`;
- predefined `USD`, `EUR`, and `RUB` are created per user as ordinary
  Commodities, not global records;
- `code`, `name`, and `symbol` are editable display/search metadata;
- `code` is unique only within one user's Commodity registry;
- `precision` defines integer minor-unit interpretation and is immutable after
  Commodity creation in the MVP;
- Commodity supports reversible closing through `isClosed` and terminal
  tombstone deletion through `isTombstone`.

Domain references should move from currency strings to Commodity ids:

- `Account` references `commodityId`;
- account Commodity is immutable after account creation; if the user selected
  the wrong Commodity, they create a new account;
- `Transaction` references `commodityId`, the transaction Commodity that
  denominates operation `value`;
- `Operation.amount` is denominated in the account Commodity;
- `Operation.value` is denominated in the transaction Commodity;
- transaction balance validation continues to use the sum of active
  `Operation.value` values.

The existing `/currencies` HTTP stub is not the target API and should be
removed during the Commodity migration rather than implemented on top of the old
model.

The public HTTP API exposes Commodity terminology through `/commodities`.
`GET /commodities` defaults to open Commodities and accepts
`status=open|closed|all`. `GET /commodities/:id` returns non-tombstoned
Commodities owned by the authenticated user. Closed Commodities remain readable
and editable, but cannot be selected for new account references until opened
again.

The MVP explicitly excludes global reference assets, market data providers,
exchange-rate history, automatic conversion, and network/contract metadata.
Those can be introduced by later ADRs if needed.

## Alternatives Considered

1. Validate LED-47 against `currencies.code` now

- Pros: small change, closes the immediate task.
- Cons: reinforces a model already known to be insufficient; makes display code
  the identity even though Commodity identity must be stable and user-owned.

2. Add foreign keys from accounts and transactions to `currencies.code`

- Pros: improves relational consistency for the current schema.
- Cons: still assumes ISO-like currency codes are the primary identity and does
  not support editable, user-owned Commodities.

3. Keep validation only in request schemas

- Pros: minimal work.
- Cons: does not protect application use cases called outside HTTP and does not
  ensure referenced monetary units exist in the system.

4. Introduce a global asset registry first

- Pros: closer to a future market data and reference-asset model.
- Cons: too large for the current product step and conflicts with the immediate
  need for user-created, user-edited Commodities.

## Consequences

- LED-47 is re-scoped: final consistency validation must use Commodity
  existence, ownership, and tombstone state instead of `currencies.code`.
- The current `Currency` value object should stop being domain identity. During
  migration it may survive only as a primitive code/format helper if useful.
- Persistence needs a `commodities` model and a migration path from existing
  currency strings to per-user Commodity records.
- Account creation must require a Commodity; account Commodity changes are not
  allowed after creation.
- Transaction creation must require `commodityId`, the transaction Commodity.
- The validation boundary for Commodity-backed account and transaction writes is
  defined separately in ADR 0021.
- Existing API and DTO surfaces may need compatibility fields while data and
  clients migrate from currency strings to Commodity ids.
- Amount validation should use Commodity precision rather than assuming all
  amounts have two decimal places.
- Commodity API clients can request open, closed, or all non-tombstoned
  Commodities explicitly. Closed Commodity records stay visible by id for audit
  and reference continuity, but cannot be selected for new account references.

## Related

- [LED-64: Commodity Registry Epic](https://gorushkin.atlassian.net/browse/LED-64)
- [LED-65: Define Commodity domain model and ADR](https://gorushkin.atlassian.net/browse/LED-65)
- [LED-47: Currency Consistency (MVP)](https://gorushkin.atlassian.net/browse/LED-47)
- [LED-109: Add Commodity domain primitives](https://gorushkin.atlassian.net/browse/LED-109)
- [LED-66: Design Commodity schema and migration path](https://gorushkin.atlassian.net/browse/LED-66)
- [LED-67: Implement Commodity persistence, repository, and defaults](https://gorushkin.atlassian.net/browse/LED-67)
- [LED-68: Move Account to immutable Commodity reference](https://gorushkin.atlassian.net/browse/LED-68)
- [LED-110: Add Commodity use cases and HTTP API](https://gorushkin.atlassian.net/browse/LED-110)
- [LED-111: Move transaction valuation to Commodity reference](https://gorushkin.atlassian.net/browse/LED-111)
- [LED-69: Validate Commodity existence, ownership, and lifecycle state](https://gorushkin.atlassian.net/browse/LED-69)
- [LED-105: Remove `/currencies` endpoint stub](https://gorushkin.atlassian.net/browse/LED-105)
- [LED-70: Replace LED-47 validation with Commodity validation](https://gorushkin.atlassian.net/browse/LED-70)
- [ADR 0019: Repository-Enforced Commodity Reference Validation](./0019-repository-enforced-commodity-reference-validation.md)
- [ADR 0021: Split Commodity Reference Business Policy From Persistence Integrity](./0021-split-commodity-reference-business-policy-from-persistence-integrity.md)
- [Multicurrency Design](../../MULTICURRENCY_DESIGN.md)
- [Domain Model](../../DOMAIN.md)
- [Database Schema](../../DATABASE_SCHEMA.md)
