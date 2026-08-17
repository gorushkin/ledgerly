# ADR 0014: Keep Amount value object name

- Status: Accepted
- Date: 2026-07-11
- Jira: https://gorushkin.atlassian.net/browse/LED-63

## Context

`Amount` represents a signed integer monetary magnitude in minor units without
Commodity identity. It is used for `Operation.amount`, `Operation.value`, account
balances and test utilities.

The name can be confused with the `Operation.amount` field, but the value
object is intentionally broader than that field. `Operation.amount` is an
`Amount` denominated in the account Commodity, while `Operation.value` is an
`Amount` denominated in the transaction Commodity.

Ledgerly previously had a separate `Money` value object for amount plus
Commodity semantics, but it was unused by the current domain model and removed
in LED-104.

## Decision

Keep the value object named `Amount`.

Document `Amount` as a signed integer minor-unit monetary amount without
Commodity identity. Use surrounding property names and domain context to
explain the Commodity denomination when needed.

Do not rename `Amount` as part of domain invariant cleanup.

## Alternatives Considered

1. Rename to `MoneyAmount`.

- Pros: highlights that the magnitude is monetary.
- Cons: historically overlapped with `Money`, which meant amount plus
  Commodity.

2. Rename to `MinorUnitAmount`.

- Pros: describes the storage invariant precisely.
- Cons: exposes a storage-oriented detail in common domain code and makes call
  sites heavier.

3. Rename to `MonetaryAmount`.

- Pros: domain-readable and distinct from the `Operation.amount` field.
- Cons: less precise than the current documented definition and still close to
  `Money`.

4. Rename to `SignedAmount`.

- Pros: highlights sign semantics.
- Cons: loses the monetary and minor-unit meaning.

## Consequences

Positive:

- Existing domain code keeps the short, established name.
- `Amount` remains usable for both `Operation.amount` and `Operation.value`.
- The distinction between `Amount` and Commodity denomination stays explicit:
  `Amount` carries only the signed minor-unit magnitude, and surrounding domain
  context supplies the Commodity.

Neutral/cost:

- Readers still need domain context to know which Commodity an `Amount` is
  denominated in.
- `Operation.amount: Amount` keeps the field/type name overlap.

## Related

- [Domain core README](../../../apps/backend/src/domain/domain-core/README.md)
- [Amount value object](../../../apps/backend/src/domain/domain-core/value-objects/Amount.ts)
- Jira: https://gorushkin.atlassian.net/browse/LED-63
