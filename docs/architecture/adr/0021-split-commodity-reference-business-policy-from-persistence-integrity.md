# ADR 0021: Split Commodity Reference Business Policy From Persistence Integrity

- Status: Accepted
- Date: 2026-08-05
- Jira: https://gorushkin.atlassian.net/browse/LED-125

## Context

ADR 0019 put Commodity reference validation in repositories. That kept account
and transaction write paths symmetric, but it mixed two different concerns:

- business policy, such as whether a closed Commodity can be used for a new
  account;
- persistence integrity, such as whether an account row can reference a
  Commodity owned by another user.

Commodity lifecycle is now explicit. `isTombstone` means terminal deletion, and
`isClosed` means a reversible business state. A closed Commodity is still valid
history, but it must not be selected for new active links.

## Decision

Commodity reference validation is split by concern.

Application use cases and application services enforce business-facing policy.
For account creation, `CreateAccountUseCase` loads the referenced Commodity
inside the transaction and delegates the check to `CommodityReferencePolicy`.
The policy restores the Commodity domain entity and rejects closed Commodities
with `CommodityClosedError`, mapped to `409 Conflict`.

Repositories must keep persistence invariants close to the write:

- the authenticated `userId` argument must match the snapshot `userId`;
- database constraints should prevent cross-user references where the child row
  stores both `userId` and a reference id;
- database foreign-key failures are mapped to infrastructure errors.

Same-user reference integrity should be represented with composite foreign keys,
for example:

```text
accounts(user_id, commodity_id)
  references commodities(user_id, id)
```

Lifecycle state must not be encoded as a database foreign key or check
constraint. `isClosed` and `isTombstone` remain domain/application policy
inputs because they have user-facing error semantics.

## Alternatives Considered

1. Keep all Commodity reference validation in repositories

- Pros: one persistence boundary handles account and transaction writes.
- Cons: repository code must know business lifecycle rules and cannot return
  specific application errors such as `CommodityClosedError`.

2. Move all validation to use cases only

- Pros: business rules are visible where application decisions are made.
- Cons: direct repository writes and future write paths can bypass same-user
  reference integrity unless the database also enforces it.

3. Split business policy from persistence integrity

- Pros: keeps domain/application errors intentional, while the database protects
  storage invariants that are true for every write path.
- Cons: requires schema constraints and tests in addition to use case policy
  tests.

## Consequences

- Closed Commodity references for new accounts are rejected by application
  policy with `CLOSED_COMMODITY_REFERENCE`.
- Missing, foreign or tombstoned Commodities are still hidden from normal lookup
  paths and surface as not found where appropriate.
- Repository tests should focus on persistence invariants and DB error mapping.
- Use case and integration tests should cover user-visible business error
  contracts.
- ADR 0019 is superseded by this decision.
- Same-user composite foreign keys for transaction and operation relations are
  implemented by LED-132.

## Related

- [ADR 0019: Repository-Enforced Commodity Reference Validation](./0019-repository-enforced-commodity-reference-validation.md)
- [ADR 0020: Terminal Tombstone and Reversible Entity States](./0020-terminal-tombstone-and-reversible-entity-states.md)
- [LED-125: Implement Commodity close open and terminal delete](https://gorushkin.atlassian.net/browse/LED-125)
- [LED-132: Add user-owned composite foreign keys for ledger relations](https://gorushkin.atlassian.net/browse/LED-132)
