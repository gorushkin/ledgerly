# ADR 0004: No minimum distinct accounts invariant

- Status: Accepted
- Date: 2026-06-17
- Jira: https://gorushkin.atlassian.net/browse/LED-44
- PR: TBD

## Context

`LED-44` proposed requiring every transaction to involve at least two distinct
accounts.

That rule rejects operation sets that are balanced and structurally valid but
economically meaningless. For example, a transaction can contain two opposite
operations on the same account. This may not be useful business activity, but
it does not violate the base transaction invariants when the transaction is
balanced.

## Decision

Do not add a "minimum two distinct accounts" domain invariant.

The domain should accept a transaction with one distinct account if it remains
balanced by operation `value` and satisfies the other active invariants. Domain
validation should enforce correctness, not economic usefulness.

## Alternatives Considered

1. Require at least two distinct accounts

- Pros: rejects some low-value or redundant transaction shapes.
- Cons: rejects balanced transactions that do not violate accounting
  correctness, and turns an economic usefulness concern into a hard domain
  rule.

2. Allow one distinct account when base invariants hold

- Pros: keeps validation focused on correctness and avoids blocking valid
  operation sets.
- Cons: permits transactions that users may later want to clean up or prevent
  through product workflow.

## Consequences

- `LED-44` should be closed as not implemented in the domain model.
- Transaction validation remains centered on transaction-level balance by
  `value` and other base invariants.
- UI or workflow may warn about economically meaningless transactions later,
  but that should not be a domain-level rejection.

## Related

- [Domain model](../../DOMAIN.md)
- [ADR 0003: No zero-net account effect invariant](./0003-no-zero-net-account-effect-invariant.md)
