# Ledgerly Domain Model

## Core Concepts

### Transaction

The main entity that represents a financial event. Transactions are built using a hierarchical structure that follows double-entry bookkeeping principles.

#### Hierarchy

```
Transaction (financial event)
  └── Operation (individual account posting)
```

> **Note:** The `Entry` entity has been removed. Operations now belong directly to a transaction via `transactionId`.

#### Key Properties

- Contains from [`MIN_TRANSACTION_OPERATIONS`](../packages/shared/src/constants/transactions.ts) to [`MAX_TRANSACTION_OPERATIONS`](../packages/shared/src/constants/transactions.ts) active **operations** (currently 2 to 1000); the count does not have to be a pair or a multiple of two
- The transaction is balanced when the sum of all operation `value` fields equals zero
- Supports split transactions
- Contains metadata (date, description, etc.)

### Operation

Represents a single financial posting affecting an account.

#### Key Properties

- Links to a transaction (`transactionId`) and an account (`accountId`)
- Belongs to a user (`userId`)
- `amount` — signed integer in the **account's Commodity** minor units
- `value` — signed integer in the **transaction valuation Commodity** minor units; used for balance validation
- `amount` and `value` must be valid integer minor-unit values. `NaN`,
  `Infinity`, missing values, and decimal/floating-point values are invalid.
  Zero is allowed and is not rejected by the domain model.
- For same-currency transactions `amount === value`
- Positive = debit, Negative = credit
- May be soft-deleted in persistence via `isTombstone`
- Tombstone operations remain part of the raw transaction aggregate state for persistence, but are excluded from active domain accessors and read API responses
- Has optional description field
- `isSystem` — reserved for future trading operations (see below)

> **Temporarily deprecated:** `isSystem = true` trading operations and system trading accounts are not created at this time. The system currently validates balance by summing `value` across all operations of a transaction (must equal 0). Trading accounts may be introduced later for full multi-currency reconciliation.

### Account

Represents different financial accounts with unified structure for all account types.

#### Key Properties

- **Type**: Asset, Liability, Income, Expense
  - **Asset**: Real money (wallet, card, bank account)
  - **Liability**: Debts, loans, credit
  - **Income**: Revenue sources (salary, interest)
  - **Expense**: Spending categories
- Has a designated Commodity
- **Balance tracking**:
  - For Asset/Liability: real balance stored in `currentClearedBalanceLocal`, must match reality
  - For Income/Expense: reporting metric (sum over period), calculated from operations
- Balance is calculated from operations
- Has initial balance (`initialBalance`)
- `isSystem = true` is reserved for future system trading accounts (currently unused)
- Has soft delete support (`isTombstone`)

### Commodity

Represents a user-owned monetary unit used in the system. Commodity identity is
a stable id, not `code`; display codes such as `USD`, `EUR`, or `RUB` are
metadata owned by each user. See
[ADR 0006](./architecture/adr/0006-commodity-registry-before-currency-validation.md).

#### Key Properties

- Each account has a designated Commodity
- Account Commodity is immutable after account creation
- Transactions have a valuation Commodity that determines `value` denomination
- Operations always store `amount` in the account's Commodity
- Commodity `code`, `name`, and `symbol` are display metadata, not identity
- Commodity `precision` defines integer minor-unit interpretation
- Commodity soft deletion is represented by technical `isTombstone` state

## Entity API Conventions

Domain entities use one public API pattern for creation, restoration and plain
state export. The current reference implementation is `Transaction` together
with application response mappers and infrastructure persistence mappers.

### Required Pattern

1. `static create(...)` creates a new entity and generates a new identity,
   timestamps and other behavior state.
2. `static restore(snapshot)` restores an entity from a plain domain snapshot.
3. `toSnapshot()` returns the entity's full plain domain state. It must not
   silently filter child state, soft-deleted state or raw aggregate members.
4. Domain entities do not import DB schema types, application DTO, shared
   request/response DTO, or HTTP-specific types.
5. Domain entities do not expose `toPersistence()`, `toResponseDTO()` or
   `fromPersistence(...)`.
6. DB and API transformations live in boundary-specific mappers. Persistence
   mapping belongs at the infrastructure boundary, while response output
   mapping belongs in application or presentation code. Both should be derived
   from domain snapshots, not from entity-owned persistence/DTO methods. For
   example, `AccountPersistenceMapper.toDBRowFromSnapshot(snapshot)` and
   `AccountMapper.toResponseDTOFromSnapshot(snapshot)` are outside the domain
   entity.

Entity timestamps are domain state. Repositories must not generate entity
`id`, `createdAt` or `updatedAt` values. `create(...)` creates identity and
initial timestamps, and behavior methods such as `update(...)` or
`markAsDeleted()` update `updatedAt` when they change entity state.
Repositories persist timestamps received through snapshots/mappers.

Soft-delete is a domain state transition, not an idempotent repository command.
Calling `markAsDeleted()` on an already deleted entity must fail with
`DELETED_ENTITY_OPERATION` and must not mutate `updatedAt` again.

Snapshot types live next to the entity in `domain/<module>/types.ts`. They use
primitive/domain-safe fields and must not be aliases for DB rows or response
DTOs.

Filtered snapshots or projections must use explicit names that describe the
filter, for example `toActiveSnapshot()` for an aggregate view containing only
active child entities. These projection methods are domain-specific and are not
required for every entity.

### Identity Access

`getId(): Id` is the canonical domain identity accessor for entities. New
domain code should use `getId()` while inside domain/application boundaries and
convert to primitive UUID only at mapper, repository, HTTP or shared DTO
boundaries through `getId().valueOf()`.

`User.id` currently returns a primitive UUID as a legacy convenience for
existing application, HTTP and test call sites. Do not copy this pattern to new
entities or new code. Removing this compatibility getter and normalizing entity
identity access is tracked by Jira
[`LED-82`](https://gorushkin.atlassian.net/browse/LED-82).

### Example Shape

```ts
export class ExampleEntity {
  static create(props: CreateExampleProps): ExampleEntity {
    // Generate identity, timestamps and domain behavior state.
  }

  static restore(snapshot: ExampleSnapshot): ExampleEntity {
    // Rebuild value objects and behaviors from plain domain state.
  }

  toSnapshot(): ExampleSnapshot {
    // Return the full primitive/domain-safe state.
  }
}
```

See [ADR 0011](./architecture/adr/0011-domain-entity-api-conventions.md) for
the architectural decision and rationale.

## Value Object API Conventions

Value objects use one public API pattern for validated construction,
restoration from plain state and comparison.

1. `static create(...)` creates a value object from new user/application input
   and applies input normalization when needed.
2. `static restore(...)` restores a value object from already persisted or
   plain domain state. It must preserve the stored value semantics and should
   not apply user-input-only normalization unless that normalization is part of
   the persisted invariant.
3. `equals(other)` is the single public value equality method. Value objects
   must not expose alternate equality aliases.
4. `valueOf()` returns the primitive/domain-safe value used in snapshots and
   mapper boundaries.
5. Domain value objects and behaviors do not expose `fromPersistence(...)`.
   Domain code restores persisted/plain state through `restore(...)` and
   exports primitive/domain-safe values through `valueOf()`. Mapper or
   repository classes outside the domain layer may still use
   `fromPersistence(...)` as a method name when their input shape is explicitly
   persistence-specific, for example DB row to read model mapping.
6. Immutable value objects are frozen at runtime with `Object.freeze(this)`
   after constructor state is initialized. `create(...)`, `restore(...)` and
   non-mutating operations such as `add(...)`, `subtract(...)` or
   `increment()` must return frozen instances. Domain entities are not frozen
   by this rule because entity lifecycle changes are modeled through explicit
   domain methods.

See
[ADR 0015](./architecture/adr/0015-domain-restoration-factory-naming.md) for
the restoration naming decision.

## Backend Request Flow

HTTP endpoints use `route -> controller -> use case -> repository/domain` as
the canonical backend request flow.

Routes own Fastify registration, transport URL shape, authenticated request
context extraction, params/query parsing where appropriate and simple transport
statuses such as `201` or `204`. Controllers orchestrate request/response
concerns that need Fastify objects, including body validation where that is the
chosen local pattern and JWT signing for auth endpoints. Use cases own
application operations, authorization/ownership checks, domain coordination,
repository interfaces and transaction boundaries. Mappers own conversion
between domain snapshots, read models, response DTOs and persistence shapes.
Repositories own persistence access.

New endpoint operations should be implemented as application use cases.
`apps/backend/src/application/services/*` is reserved for helper orchestration
used by use cases. Root-level `apps/backend/src/services/*` is legacy and must
not be used for new HTTP endpoint operations.

See [ADR 0016](./architecture/adr/0016-backend-request-flow.md) for the full
decision, validation/JWT/transaction-boundary guidance and follow-up migration
tasks.

## Business Rules

### Double-Entry Bookkeeping

1. Each transaction must contain from `MIN_TRANSACTION_OPERATIONS` to `MAX_TRANSACTION_OPERATIONS` active operations (currently 2 to 1000; see [`transactions.ts`](../packages/shared/src/constants/transactions.ts))
2. The operation count does not have to be a pair or a multiple of two
3. **Balance rule**: sum of `value` across all operations in a transaction must equal zero
4. Positive amount = debit, Negative amount = credit
5. Monetary fields (`amount` and `value`) are integer minor-units and must be
   finite valid values. `0` is allowed.
6. System-wide balance: sum of all operations across all accounts must equal zero
7. There is no minimum number of distinct accounts per transaction. A
   transaction may be economically meaningless but still valid when it is
   balanced and does not violate the base invariants.
8. Reusing the same account within one transaction is allowed even when the
   account-level sum of `amount` is zero. Example: `Cash -100` and `Cash +100`
   can be a valid transaction when the transaction-level balance rule is
   satisfied; there is no separate "non-zero net effect per account" invariant.

### Commodity Handling

1. Each operation carries both `amount` (account Commodity) and `value` (transaction valuation Commodity)
2. For same-currency operations `amount === value`
3. **Trading operations** (`isSystem = true`) and system trading accounts are **not currently implemented**; they are reserved for a future multi-currency reconciliation phase

### Account Balance

1. **Asset/Liability accounts**: Balance is stored and must match real-world balance
2. **Income/Expense accounts**: Balance is calculated as sum of operations, used only for reporting
3. Global balance rule: sum of all operations across all accounts = 0

### Deletion Semantics (MVP)

1. Transactions use soft delete via `isTombstone`
2. Tombstone transactions must not appear in normal read API responses
3. Operations may also be marked with `isTombstone` in persistence
4. Transaction repositories restore the full raw aggregate state, including tombstone operations
5. The `Transaction` aggregate separates raw and active operation access:
   - `toSnapshot()` returns the full aggregate snapshot, including tombstone operations
   - `toActiveSnapshot()` returns an active-only snapshot when a snapshot-shaped projection is needed
   - `getAllOperations()` returns all known operations for persistence
   - `getOperations()` returns active operations only for domain logic
   - tombstone operations are not returned to clients and are ignored by normal read flows
6. Tombstone operations cannot be updated after they are restored into the aggregate

### Concurrency Boundary

1. `Transaction` is the aggregate root and owns the concurrency boundary for its operations
2. Every transaction update supplies the expected `Transaction.version`
3. Changes to transaction metadata or operations increment `Transaction.version` once per aggregate update
4. The repository updates the transaction with compare-and-update semantics before saving its operations in the same database transaction
5. `Operation` does not have a separate version because it has no independent write API or use case
6. Operation-level versioning should be introduced only if operations become independently mutable outside the `Transaction` aggregate

### Operation Application Boundary

1. `Transaction` is the only application write boundary for its operations
2. Operations are created, updated, and deleted only through transaction use cases
3. `Operation` has no independent write API or public application use cases
4. Operation mappers, domain entities, and persistence collaborators are internal details of the transaction flow
5. This boundary should be reconsidered only if operations gain an independent lifecycle, authorization model, version, API, or background processing
6. See [ADR 0002: Operation application boundary](./architecture/adr/0002-operation-application-boundary.md)

### Transaction List Query

1. `accountId` selects transactions containing at least one active operation for the account, while the response includes all active operations of each matching transaction
2. `dateFrom` and `dateTo` filter `transactionDate` inclusively
3. Pagination is page-based with defaults `page=1` and `pageSize=20`; `pageSize` cannot exceed 100
4. Results are sorted by `transactionDate DESC` by default
5. Clients may sort by `transactionDate` or `postingDate` in ascending or descending order
6. `createdAt` and `id` are deterministic tie-breakers for pagination
7. Tombstone transactions and operations are always excluded; the list API does not support `includeArchived`

## Examples

### Simple Transaction (Grocery Purchase)

**Scenario**: Buy groceries for 10000 kopeks (100₽) in cash

**Transaction**
| id | description | transactionDate | postingDate | userId |
|----|-------------|-----------------|-------------|--------|
| T1 | Buy groceries | 2025-09-17 | 2025-09-17 | U1 |

**Operations**
| id | transactionId | accountId | account | amount (kopeks) | value (kopeks) |
|----|---------------|-----------|---------|-----------------|----------------|
| O1 | T1 | A1 | Asset:Cash | -10000 | -10000 |
| O2 | T1 | A2 | Expense:Food | +10000 | +10000 |

Balance: `sum(value) = -10000 + 10000 = 0` ✓

**Note**: Amounts are stored as integers (kopeks/cents) to avoid floating-point precision issues.

### Multi-Currency Transaction (future — trading accounts not yet implemented)

**Scenario**: Buy goods for 9 EUR, pay with cash in USD (10 USD = 1000 cents)

When trading accounts are introduced, the transaction will look like:

**Operations**
| id | transactionId | accountId | account | amount (cents) | value (USD cents) | isSystem |
|----|---------------|-----------|---------|----------------|-------------------|----------|
| O3 | T2 | A3 | Asset:Cash USD | -1000 | -1000 | false |
| O4 | T2 | A4 | System:Trading:USD | +1000 | +1000 | true |
| O5 | T2 | A5 | System:Trading:EUR | -900 | +900 | true |
| O6 | T2 | A6 | Expense:Goods EUR | +900 | -900 | false |

Balance: `sum(value) = 0` ✓ — currently this phase is not implemented.

## Technical Implementation

### Technology Stack

- Backend: Node.js 22.14.0
- API Server: Fastify
- Database: SQLite
- ORM: Drizzle
- Package Manager: pnpm 10.10.0
- Validation: Zod

### Database Schema

```
Transaction
- id: UUID
- valuationCommodityId: UUID (FK) -- denominates operation value fields
- description: string
- transactionDate: date (ISO string)
- postingDate: date (ISO string)
- version: integer              -- optimistic concurrency token for the aggregate
- isTombstone: boolean
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Operation
- id: UUID
- transactionId: UUID (FK)   -- directly linked to Transaction (Entry removed)
- accountId: UUID (FK)
- amount: integer             -- in account Commodity minor units
- value: integer              -- in transaction valuation Commodity minor units; used for balance validation
- description: string (optional)
- isSystem: boolean           -- reserved for future trading operations (currently always false)
- isTombstone: boolean
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Account
- id: UUID
- name: string
- type: enum (Asset, Liability, Income, Expense)
- commodityId: UUID (FK)
- description: string
- initialBalance: integer (cents)
- currentClearedBalanceLocal: integer (cents)
- isSystem: boolean (for trading accounts)
- isTombstone: boolean
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Commodity
- id: UUID
- userId: UUID (FK)
- code: string                 -- display/search value, unique per user
- name: string
- symbol: string (optional)
- precision: integer           -- immutable after creation in the MVP
- isTombstone: boolean
- createdAt: timestamp
- updatedAt: timestamp

Settings
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp
```

### Data Types and Conventions

- **Money amounts**: Stored as integers (cents/kopeks) to avoid floating-point precision issues
- **Dates**: ISO date strings for transactionDate and postingDate
- **Timestamps**: ISO datetime strings with branded types (`IsoDatetimeString`)
- **IDs**: UUIDs for all entities
- **Soft deletion**: Uses `isTombstone` flag instead of hard deletes
- **MVP operation deletion rule**: deleted operations may remain in raw aggregate and storage state, but are excluded from active domain/read behavior
- **System entities**: System accounts and operations marked with `isSystem = true`

## Future Improvements

### Planned Features

1. Budget tracking
2. Currency rate caching and historical tracking
3. Automatic currency conversion through trading entries
4. Account-based reports (balance sheets, income statements)
5. Balance forecasting
6. Recurring transactions
7. Transaction templates

### Architecture Improvements

1. Enhanced validation layers:
   - Schema validation (Zod)
   - Domain validation (business rules)
   - Database constraints (Drizzle)
2. Branded types for Commodity codes, Commodity precision, and other primitive domain values where useful
3. Operation hash-based idempotent updates
4. Enhanced error handling with domain-specific errors

## Architecture Notes

1. **Domain-Driven Design (DDD)**:
   - Transaction as Aggregate Root containing Operations
   - Strong business invariants enforcement
2. **Clean Architecture principles**:
   - Domain layer (entities + business rules)
   - Application layer (use cases)
   - Infrastructure layer (repositories, database)
   - Presentation layer (API/controllers)
3. **Validation at multiple levels**:
   - Schema validation (Zod)
   - Domain validation (business rules, double-entry balance)
   - Database constraints (foreign keys, unique constraints)
4. **Data layer separation**:
   - DbRow (database representation)
   - Repository DTOs (data transfer)
   - Domain entities (business logic)
   - Service DTOs (application layer)
5. **Repository patterns**:
   - Minimal business logic in repositories
   - Idempotent operations (return `undefined` instead of throwing errors)
   - User ownership checks in service layer
   - Read-side returns active data only
   - Write-side repositories restore and persist raw aggregate state, including tombstone operations
   - Domain business accessors expose active operations by default
6. **Type safety**:
   - Branded types for dates (`IsoDatetimeString`)
   - Branded types for Commodity codes, Commodity precision, dates, and other primitive domain values where useful
   - Strict TypeScript configuration
   - Error handling
   - Response serialization
