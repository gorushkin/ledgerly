# ADR 0005: No non-zero operation invariant

- Status: Accepted
- Date: 2026-06-19
- Jira: https://gorushkin.atlassian.net/browse/LED-45
- PR: TBD

## Context

`LED-45` proposed rejecting transactions that contain an operation with zero
`value`.

A zero-value operation does not affect any account balance and does not violate
the core transaction accounting invariant. It is usually low-value or noisy
data, but that alone is not enough to make it an invalid transaction.

The project should avoid adding domain restrictions before there is a real
product case that requires the restriction.

## Decision

Do not add a "non-zero operation value" domain invariant.

The domain may accept a transaction containing a zero-value operation if the
transaction remains balanced and satisfies the other active invariants. Zero
operations can be prevented, hidden, cleaned up, or warned about later in UI,
import, or workflow code when a concrete product case appears.

## Alternatives Considered

1. Reject zero-value operations in the domain model

- Pros: prevents some noisy transaction data.
- Cons: rejects data that does not break balance correctness and adds a hard
  rule without a proven domain or product requirement.

2. Allow zero-value operations while base invariants hold

- Pros: keeps domain validation focused on accounting correctness and avoids
  premature constraints.
- Cons: permits low-value data that a future workflow may need to clean up or
  discourage.

## Consequences

- `LED-45` should be closed as not implemented in the domain model.
- Transaction validation remains centered on transaction-level balance by
  `value` and other active invariants.
- Future product workflows may add soft validation or cleanup for zero-value
  operations, but that should be driven by a concrete use case.

## Related

- [Domain model](../../DOMAIN.md)
- [ADR 0003: No zero-net account effect invariant](./0003-no-zero-net-account-effect-invariant.md)
- [ADR 0004: No minimum distinct accounts invariant](./0004-no-minimum-distinct-accounts-invariant.md)
