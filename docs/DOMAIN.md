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
- For same-currency transactions `amount === value`
- Positive = debit, Negative = credit
- Has soft delete support (`isTombstone`)
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
5. System-wide balance: sum of all operations across all accounts must equal zero

### Currency Handling
1. Each operation carries both `amount` (account currency) and `value` (transaction currency)
2. For same-currency operations `amount === value`
3. **Trading operations** (`isSystem = true`) and system trading accounts are **not currently implemented**; they are reserved for a future multi-currency reconciliation phase

### Account Balance
1. **Asset/Liability accounts**: Balance is stored and must match real-world balance
2. **Income/Expense accounts**: Balance is calculated as sum of operations, used only for reporting
3. Global balance rule: sum of all operations across all accounts = 0

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
   - Transaction as Aggregate Root containing Entries
   - Entries contain Operations
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
6. **Type safety**:
   - Branded types for dates (`IsoDatetimeString`)
   - Planned branded types for `Money` and `CurrencyCode`
   - Strict TypeScript configuration
   - Error handling
   - Response serialization