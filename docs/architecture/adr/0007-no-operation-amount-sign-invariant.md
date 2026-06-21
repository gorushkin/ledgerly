# ADR 0007: No operation amount sign invariant

- Status: Accepted
- Date: 2026-06-21
- Jira: https://gorushkin.atlassian.net/browse/LED-53
- PR: TBD

## Context

`LED-53` proposed requiring every transaction to contain at least one operation
with a positive `amount` and one with a negative `amount`.

`amount` is denominated in an operation's account currency. Its sign represents
the change to that particular account, not a universal debit or credit
classification. The meaning of a debit or credit depends on account type, and
cross-currency transactions may use `amount` values that cannot be compared as
a transaction-wide accounting invariant.

The domain already validates the relevant transaction-level invariant: the sum
of operation `value` values in the transaction currency must equal zero.

## Decision

Do not add a transaction invariant requiring positive and negative operation
`amount` values.

Transaction validation remains based on the sum of `value` values and the
existing structural invariants. A future workflow may warn about unusual
operation shapes only when it has a concrete product rule and can interpret
account types correctly.

## Alternatives Considered

1. Require both `amount` signs in every transaction

- Pros: rejects a small class of suspicious operation sets.
- Cons: treats raw account-currency amounts as debit/credit semantics and can
  reject valid accounting shapes.

2. Derive debit and credit from account types

- Pros: can express accounting semantics explicitly.
- Cons: requires a defined account-type model and a concrete product use case;
  neither is part of the current transaction model.

3. Keep the existing balance invariant

- Pros: preserves correctness across the current multicurrency model without
  introducing a false restriction.
- Cons: allows operation shapes that a future UI or import workflow may flag.

## Consequences

- `LED-53` is not implemented as a domain validation rule.
- No code or test changes are required for this decision.
- Any later debit/credit validation must be designed around account types,
  currencies, and a defined business use case.

## Related

- [Domain model](../../DOMAIN.md)
- [Multicurrency design](../../MULTICURRENCY_DESIGN.md)
- [ADR 0003: No zero-net account effect invariant](./0003-no-zero-net-account-effect-invariant.md)
- [ADR 0005: No non-zero operation invariant](./0005-no-non-zero-operation-invariant.md)
