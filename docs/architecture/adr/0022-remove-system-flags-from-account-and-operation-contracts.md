# ADR 0022: Remove system flags from account and operation contracts

- Status: Accepted
- Date: 2026-08-07
- Jira: https://gorushkin.atlassian.net/browse/LED-92

## Context

The account model previously carried balance-derived fields and a system flag,
while operations also exposed an `isSystem` flag reserved for future trading
postings. These fields leaked planned multi-currency implementation details into
the current domain, database schema, and response DTOs.

The current product flow does not create trading accounts or automated trading
operations. Transaction correctness is enforced by summing operation `value`
fields to zero within the `Transaction` aggregate.

## Decision

Remove system flags from current account and operation contracts:

1. `Account` and account response DTOs do not expose `isSystem`.
2. `Operation`, operation snapshots, operation persistence rows, read models,
   and response DTOs do not expose `isSystem`.
3. The `accounts` and `operations` tables do not contain `is_system` columns.
4. Future trading-account support must introduce explicit behavior and schema
   when it is implemented, instead of relying on placeholder flags in the
   current model.

## Alternatives Considered

1. Keep `isSystem` as a reserved flag

- Pros: future trading postings could reuse an existing field.
- Cons: preserves unused API and database surface, creates unclear semantics,
  and requires clients/tests to handle a value that is always false today.

2. Keep operation-level `isSystem` but remove account-level `isSystem`

- Pros: narrower change and closer to the earlier planned trading-posting
  design.
- Cons: still leaks unimplemented behavior into transaction responses and keeps
  a persistence column without current behavior.

3. Remove system flags now

- Pros: current contracts match implemented behavior, future reconciliation can
  be designed with concrete requirements, and domain snapshots stay focused on
  active invariants.
- Cons: future trading-account work will need an explicit migration and API
  decision if it needs to distinguish generated postings.

## Consequences

Positive:

- Account and operation DTOs no longer expose unused system flags.
- Database schema no longer stores placeholder system-state columns.
- Multi-currency documentation can describe trading accounts as future behavior
  without committing the current API to a flag-based design.

Neutral/Cost:

- Any future automated reconciliation feature will need a new ADR or an update
  to this decision before adding generated-posting metadata.
- Existing consumers expecting `operations[].isSystem` must be updated.

## Related

- [ADR 0002: Operation application boundary](./0002-operation-application-boundary.md)
- [Domain documentation](../../DOMAIN.md)
- [Database schema documentation](../../DATABASE_SCHEMA.md)
- [Multi-currency design](../../MULTICURRENCY_DESIGN.md)
