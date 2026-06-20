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

- Contains one or more **operations** (any count, not required to be a pair)
- The transaction is balanced when the sum of all operation `value` fields equals zero
- Supports split transactions
- Contains metadata (date, description, etc.)

### Operation

Represents a single financial posting affecting an account.

#### Key Properties

- Links to a transaction (`transactionId`) and an account (`accountId`)
- Belongs to a user (`userId`)
- `amount` — signed integer in the **account's native currency** (cents)
- `value` — signed integer in the **transaction's currency** (cents); used for balance validation
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
- Has a designated currency
- **Balance tracking**:
  - For Asset/Liability: real balance stored in `currentClearedBalanceLocal`, must match reality
  - For Income/Expense: reporting metric (sum over period), calculated from operations
- Balance is calculated from operations
- Has initial balance (`initialBalance`)
- `isSystem = true` is reserved for future system trading accounts (currently unused)
- Has soft delete support (`isTombstone`)

### Currency

Represents different monetary units used in the system.

> Design note: this concept is expected to evolve into an asset/commodity
> registry before transaction currency existence validation is finalized. Fiat
> currencies, crypto assets, tokenized assets on different networks, and custom
> user-defined assets should not all rely on a currency code as primary
> identity. See
> [ADR 0006](./architecture/adr/0006-asset-registry-before-currency-validation.md).

#### Key Properties

- Each account has a designated currency
- System has a base currency for reporting
- Operations always store amounts in the account's currency
- Currency conversion is handled through trading operations
- Historical rates can be stored for accurate reporting

## Business Rules

### Double-Entry Bookkeeping

1. Each transaction must have at least one operation
2. Operations can be any count (no minimum of two, no requirement to be a multiple of two)
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

### Currency Handling

1. Each operation carries both `amount` (account currency) and `value` (transaction currency)
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
- amount: integer             -- in account's native currency (cents)
- value: integer              -- in transaction's currency (cents); used for balance validation
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
- currency: string (FK)
- description: string
- initialBalance: integer (cents)
- currentClearedBalanceLocal: integer (cents)
- isSystem: boolean (for trading accounts)
- isTombstone: boolean
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Currency
- code: string (PK)
- name: string
- symbol: string

Future asset registry direction:
- id: UUID or stable asset identifier
- type: fiat | crypto | commodity | custom
- code/symbol: display and search values, not necessarily globally unique
- precision: minor-unit scale for integer amount storage
- network and contract address: optional metadata for tokenized assets
- createdByUserId: nullable owner for user-defined assets

Settings
- userId: UUID (PK, FK)
- baseCurrency: string (FK)
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
2. Branded types for Money and CurrencyCode
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
   - Planned branded types for `Money` and `CurrencyCode`
   - Strict TypeScript configuration
   - Error handling
   - Response serialization
