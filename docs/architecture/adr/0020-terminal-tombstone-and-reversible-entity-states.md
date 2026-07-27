# ADR 0020: Terminal Tombstone and Reversible Entity States

- Status: Proposed
- Date: 2026-07-27
- Jira: https://gorushkin.atlassian.net/browse/LED-122
- PR: TBD

## Context

`isTombstone` currently risks carrying two different meanings:

- irreversible deletion for `Transaction` and `Operation`;
- reversible archive or close behavior for `Account` and `Commodity`.

This makes use case, repository and HTTP handler naming harder to reason about.
For example, a `DELETE` route can end up invoking an archive or soft-delete
operation even though the domain operation is potentially reversible.

The domain needs one stable meaning for tombstone state and separate business
states for reversible lifecycle changes.

## Decision

`isTombstone = true` means irreversible deletion without recovery.

The transition:

```text
isTombstone: false -> true
```

is terminal for every entity. Tombstoned entities must not have a general
restore method.

Entity states are separated as follows:

| Entity | Reversible state | Irreversible state |
| --- | --- | --- |
| `Transaction` | --- | `isTombstone` |
| `Operation` | --- | `isTombstone` |
| `Account` | `isClosed` | `isTombstone` |
| `Commodity` | `isArchived` | `isTombstone` |

### Account

A closed account:

- keeps its full history;
- participates in reports and calculations;
- does not accept new operations;
- can be reopened.

The domain API should express that lifecycle explicitly:

```ts
account.close();
account.reopen();
```

### Commodity

An archived commodity:

- remains available for old operations;
- participates in historical calculations;
- is not offered for new operations and accounts;
- can be returned from archive.

The domain API should express that lifecycle explicitly:

```ts
commodity.archive();
commodity.unarchive();
```

### Deletion

Terminal tombstone deletion should be represented explicitly:

```ts
transaction.delete();
operation.delete();
account.delete();
commodity.delete();
```

Deletion of already used `Account` and `Commodity` may be forbidden:

- an empty entity created by mistake can be deleted;
- an entity used in history can only be closed or archived.

With this split, `isTombstone` remains a technical marker for irreversible
deletion, while `isClosed` and `isArchived` describe reversible business states.

## Alternatives Considered

1. Keep using `isTombstone` for both soft-delete and archive-like behavior

- Pros: no schema migration and fewer state fields.
- Cons: keeps terminal deletion and reversible business states ambiguous,
  making use case names, route handlers and query filters harder to understand.

2. Rename tombstone operations to archive everywhere

- Pros: improves wording for `Account` and `Commodity`.
- Cons: is incorrect for `Transaction` and `Operation`, where deletion should
  remain terminal and non-reversible.

3. Split terminal tombstone from reversible business states

- Pros: gives each state one meaning, keeps `DELETE` aligned with terminal
  deletion, and lets account and commodity lifecycle rules evolve separately.
- Cons: requires schema, domain, repository, use case, API and test updates.

## Consequences

- `Transaction` and `Operation` tombstone state is irreversible.
- `Account` needs `isClosed`, plus `close()` and `reopen()` behavior.
- `Commodity` needs `isArchived`, plus `archive()` and `unarchive()` behavior.
- `DELETE` routes should mean terminal deletion. If an account or commodity is
  already used in history, terminal deletion can be rejected with guidance to
  close or archive instead.
- Query filters for account and commodity reads should distinguish active,
  closed or archived, and all non-tombstoned records. Tombstoned records should
  remain hidden from normal reads.
- Tests must cover tombstone terminality and business-state invariants:
  tombstoned entities cannot be restored or modified; closed accounts cannot
  receive new operations; archived commodities cannot be selected for new
  accounts or new operations according to the final policy.

## Open Questions

- Does "archived commodity is not offered for new operations" mean only direct
  commodity selection is forbidden, or also operations through existing active
  accounts that reference the archived commodity?
- Should `DELETE /accounts/:id` return an error for historically used accounts
  with a hint to close instead of tombstoning?

## Related

- [LED-122: Define terminal tombstone and reversible archive/close states](https://gorushkin.atlassian.net/browse/LED-122)
- [ADR 0011: Domain Entity API Conventions](./0011-domain-entity-api-conventions.md)
- [ADR 0015: Domain Restoration Factory Naming](./0015-domain-restoration-factory-naming.md)
- [ADR 0019: Repository-Enforced Commodity Reference Validation](./0019-repository-enforced-commodity-reference-validation.md)
