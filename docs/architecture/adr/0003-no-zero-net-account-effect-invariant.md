# ADR 0003: No zero-net account effect invariant

- Status: Accepted
- Date: 2026-06-17
- Jira: https://gorushkin.atlassian.net/browse/LED-43
- PR: TBD

## Context

`LED-43` proposed rejecting transactions where the same account appears more
than once and the sum of `amount` for that account is zero.

That rule rejects valid accounting shapes. For example, the same transaction
may contain:

```text
Cash -100
Cash +100
```

This has no net effect on `Cash`, but the repeated account usage is not itself
invalid. The domain already enforces the meaningful transaction invariant:
the sum of operation `value` across the transaction must equal zero.

## Decision

Do not add a "zero-net effect per account" invariant.

Repeated account usage remains valid regardless of the account-level sum of
`amount`, as long as the transaction satisfies the existing transaction-level
balance rule and other active invariants.

## Alternatives Considered

1. Reject zero net effect per account

- Pros: catches some redundant operation shapes.
- Cons: rejects valid transactions and adds a rule with weak domain value.

2. Allow repeated accounts with zero account-level net amount

- Pros: keeps the model closer to accounting semantics and avoids rejecting
  valid operation sets.
- Cons: permits redundant operation pairs that may be cleaned up by UI or user
  workflow later.

## Consequences

- `LED-43` should not be implemented as originally described.
- Validation remains focused on transaction-level balance by `value`.
- UI may still warn about redundant operations later, but that should be a
  workflow hint, not a domain invariant.

## Related

- [Domain model](../../DOMAIN.md)
- [ADR 0002: Operation application boundary](./0002-operation-application-boundary.md)
