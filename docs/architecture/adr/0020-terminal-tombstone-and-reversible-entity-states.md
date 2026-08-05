# ADR 0020: Terminal Tombstone and Reversible Entity States

- Status: Accepted
- Date: 2026-07-27
- Jira: https://gorushkin.atlassian.net/browse/LED-122
- PR: TBD

## Context

`isTombstone` currently risks carrying two different meanings:

- irreversible deletion for `Transaction` and `Operation`;
- reversible close behavior for `Account` and `Commodity`.

This makes use case, repository and HTTP handler naming harder to reason about.
For example, a `DELETE` route can end up invoking a reversible lifecycle or
soft-delete operation even though the domain operation is potentially
reversible.

The domain needs one stable meaning for tombstone state and separate business
states for reversible lifecycle changes.

## Decision

Lifecycle terminology must reflect the business domain, not the internal
storage mechanism. API symmetry is not a goal when entities have different
business meanings.

`isTombstone = true` means irreversible deletion without recovery.

The transition:

```text
isTombstone: false -> true
```

is terminal for every entity. Tombstoned entities must not have a general
restore method.

Entity states are separated as follows:

| Entity        | Reversible state | Irreversible state |
| ------------- | ---------------- | ------------------ |
| `Transaction` | ---              | `isTombstone`      |
| `Operation`   | ---              | `isTombstone`      |
| `Account`     | `isClosed`       | `isTombstone`      |
| `Commodity`   | `isClosed`       | `isTombstone`      |

### Account

A closed account:

- keeps its full history;
- participates in reports and calculations;
- does not accept new operations;
- can be opened again.

The domain API should express that lifecycle explicitly:

```ts
account.close();
account.open();
```

The `close` term matches account lifecycle language: an account can stop
accepting new operations while keeping its history and later be opened again.

`close()` and `open()` are idempotent. Calling `close()` for an already closed
account leaves it closed. Calling `open()` for an already open account leaves it
open.

Closed accounts cannot be edited through the regular account update flow. The
only user-facing fields that may remain editable for a closed account are
descriptive fields:

- `name`;
- `description`.

`type` can be changed only while the account has no active operations. After an
account has participated in operations, its type is part of the historical
accounting model and must not be changed.

Account list queries use account lifecycle language:

- `open`;
- `closed`;
- `all`.

Every normal account list filter excludes tombstoned accounts.

| Filter   | Predicate                                    |
| -------- | -------------------------------------------- |
| `open`   | `isClosed = false` and `isTombstone = false` |
| `closed` | `isClosed = true` and `isTombstone = false`  |
| `all`    | `isTombstone = false`                        |

Account close and open are exposed as explicit HTTP actions:

```http
POST /accounts/:id/close
POST /accounts/:id/open
```

`PATCH /accounts/:id` remains for editable account attributes, not lifecycle
commands.

Account terminal delete should be idempotent at the HTTP and use case level.
Repeating `DELETE /accounts/:id` for an account that already belongs to the user
and already has `isTombstone = true` should keep the tombstone state and return
the delete success response without changing `updatedAt` again. Normal account
reads, list filters, update, close and open still exclude tombstoned accounts.

The current `AccountRepository.getByIdForLifecycle(...)` method is an unfinished
implementation hook for that delete-specific lookup. It intentionally reads
tombstoned accounts, but at the moment it is not wired into the account delete
use case, so it is redundant outside tests until the follow-up work is applied.
It must not become the general account read path.

### Commodity

A closed commodity:

- remains available for old operations;
- participates in historical calculations;
- is not offered for new accounts or active selection;
- can be opened again.

The domain API should express that lifecycle explicitly:

```ts
commodity.close();
commodity.open();
```

Commodity uses the same reversible lifecycle vocabulary as accounts. `close`
means the commodity remains a historical accounting unit, but it cannot be used
for new active references until it is opened again.

`close()` and `open()` are idempotent. Repeating either command keeps the
desired final state and must not:

- throw a domain error;
- increment version;
- change `updatedAt`;
- create another journal record;
- publish another domain event.

Closed commodity remains editable because close is not an immutable state. It is
a reversible exclusion from active choice. Ordinary edits use
`PATCH /commodities/:id` and must not accept lifecycle fields such as
`isClosed`.

Commodity lifecycle commands are exposed as explicit domain actions:

```http
POST /commodities/:id/close
POST /commodities/:id/open
```

The expected HTTP responses are:

```http
POST /commodities/:id/close -> 200 OK
POST /commodities/:id/open -> 200 OK
PATCH /commodities/:id -> 200 OK
DELETE /commodities/:id -> 204 No Content
```

`DELETE /commodities/:id` is idempotent at the HTTP level. Repeating it for an
already tombstoned commodity keeps the tombstone state and returns `204 No
Content`. The domain `commodity.delete()` operation may be a no-op in that
state, without changing version, `updatedAt`, journal records or domain events.

Closed commodity means the commodity cannot be used to create new active
links. It is forbidden to:

- create a new account with this commodity;
- change an existing account to this commodity;
- offer it as an active choice in UI.

Existing accounts that already reference the commodity remain valid and keep
their history.

Commodity list filters use `isClosed` and `isTombstone` as separate state
axes:

| Filter   | Predicate                                    |
| -------- | -------------------------------------------- |
| `open`   | `isClosed = false` and `isTombstone = false` |
| `closed` | `isClosed = true` and `isTombstone = false`  |
| `all`    | `isTombstone = false`                        |

Tombstoned commodities are always hidden from normal commodity reads.

`open()` does not depend on the lifecycle state of related accounts.

### Deletion

Terminal tombstone deletion should be represented explicitly:

```ts
transaction.delete();
operation.delete();
account.delete();
commodity.delete();
```

`DELETE` means only terminal tombstone deletion. It must not be used for
reversible account or commodity close transitions.

An account can be terminally deleted only when all related operations are either:

- already tombstoned with `isTombstone = true`; or
- moved to other accounts.

Otherwise the account keeps historical accounting meaning and should be closed
instead of deleted.

Commodity can be terminally deleted only when no active domain entity references
it. Deletion is allowed when:

- all related accounts are tombstoned;
- all related operations are tombstoned;
- or active references were moved to another commodity.

The check is about active references, not historical rows.

With this split, `isTombstone` remains a technical marker for irreversible
deletion, while `isClosed` describes reversible business states for accounts
and commodities.

The intended public domain methods are:

| Entity      | Reversible state | Methods              |
| ----------- | ---------------- | -------------------- |
| `Account`   | `isClosed`       | `close()` / `open()` |
| `Commodity` | `isClosed`       | `close()` / `open()` |
| Any entity  | `isTombstone`    | `delete()`           |

## Alternatives Considered

1. Keep using `isTombstone` for both soft-delete and archive-like behavior

- Pros: no schema migration and fewer state fields.
- Cons: keeps terminal deletion and reversible business states ambiguous,
  making use case names, route handlers and query filters harder to understand.

2. Rename tombstone operations to archive everywhere

- Pros: improves wording for `Account` and `Commodity`.
- Cons: is incorrect for `Transaction` and `Operation`, where deletion should
  remain terminal and non-reversible. It also forces account terminology into
  commodity terminology.

3. Split terminal tombstone from reversible business states

- Pros: gives each state one meaning, keeps `DELETE` aligned with terminal
  deletion, and lets account and commodity lifecycle rules evolve separately.
- Cons: requires schema, domain, repository, use case, API and test updates.

4. Use separate archive terminology for `Commodity`

- Pros: can describe removal from active selection more literally.
- Cons: creates an unnecessary vocabulary split for two reversible states that
  behave the same way in API and persistence. Symmetric `close()` / `open()`
  operations are easier to use consistently across `Account` and `Commodity`.

## Consequences

- `Transaction` and `Operation` tombstone state is irreversible.
- `Account` needs `isClosed`, plus `close()` and `open()` behavior.
- `Commodity` needs `isClosed`, plus `close()` and `open()` behavior.
- `DELETE` routes should mean terminal deletion. Account deletion must be
  rejected while active operations still reference the account. Commodity
  deletion must be rejected while any active domain entity still references the
  commodity.
- Query filters for account and commodity reads should distinguish open, closed
  and all non-tombstoned records. Account and commodity filters use
  `open|closed|all`. Tombstoned records should remain hidden from normal reads.
- Tests must cover tombstone terminality and business-state invariants:
  tombstoned entities cannot be restored or modified; closed accounts cannot
  receive new operations and can only update descriptive account fields; closed
  commodities cannot be selected for new active links.

## Related

- [LED-123: Define entity lifecycle states](https://gorushkin.atlassian.net/browse/LED-123)
- [LED-122: Define terminal tombstone and reversible archive/close states](https://gorushkin.atlassian.net/browse/LED-122)
- [LED-124: Implement Account close open and terminal delete](https://gorushkin.atlassian.net/browse/LED-124)
- [LED-125: Implement Commodity close open and terminal delete](https://gorushkin.atlassian.net/browse/LED-125)
- [ADR 0011: Domain Entity API Conventions](./0011-domain-entity-api-conventions.md)
- [ADR 0015: Domain Restoration Factory Naming](./0015-domain-restoration-factory-naming.md)
- [ADR 0019: Repository-Enforced Commodity Reference Validation](./0019-repository-enforced-commodity-reference-validation.md)
- [ADR 0021: Split Commodity Reference Business Policy From Persistence Integrity](./0021-split-commodity-reference-business-policy-from-persistence-integrity.md)
