# Ledgerly Domain Model

## Core Concepts

### Transaction
The main entity that represents a financial event. Transactions are built using a hierarchical structure that follows double-entry bookkeeping principles.

#### Hierarchy
```
Transaction (financial event)
  └── Entry (balancing wrapper, groups operations per currency)
      └── Operation (individual account posting)
```

#### Key Properties
- Contains one or more **entries**
- Each entry must be balanced (sum of operations = 0)
- Supports split transactions
- Contains metadata (date, description, etc.)
- Must be balanced overall according to double-entry bookkeeping

### Entry
Groups related operations within a transaction to maintain per-currency balance.

#### Key Properties
- Belongs to a transaction (`transactionId`)
- Belongs to a user (`userId`)
- Contains minimum 2 operations (debit and credit sides)
- Sum of all operations must equal zero
- Handles multi-currency operations through multiple entries with trading operations
- Can contain 2 operations (simple case) or more (multi-account transactions)
- Has soft delete support (`isTombstone`)

### Operation
Represents a single financial posting affecting an account.

#### Key Properties
- Links to an entry (`entryId`) and an account (`accountId`)
- Belongs to a user (`userId`)
- Amount is always stored as integer (cents) in the account's currency
- Positive amount = debit
  - Increases Asset and Expense accounts
  - Decreases Liability and Income accounts
- Negative amount = credit
  - Decreases Asset and Expense accounts
  - Increases Liability and Income accounts
- Trading operations are created automatically for currency conversion (`isSystem = true`)
- Has soft delete support (`isTombstone`)
- Has optional description field

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
- System accounts have `isSystem = true` (for trading accounts)
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
1. Each transaction must have at least one entry
2. Each entry must have at least two operations
3. Sum of all operations within an entry must equal zero
4. Positive amount represents debit:
   - Increases Asset and Expense accounts
   - Decreases Liability, Income, and Equity accounts
5. Negative amount represents credit:
   - Decreases Asset and Expense accounts
   - Increases Liability, Income, and Equity accounts
6. System-wide balance: sum of all operations across all accounts must equal zero

### Currency Handling
1. **Income/Expense accounts**: Balance is calculated as the sum of operations within a specified reporting period, used only for reporting
2. When an entry involves different currencies, trading operations are automatically created
3. Trading operations balance currency differences within an entry
4. Currency conversion context is stored in trading operations, not in main operations
5. Historical conversion rates should be preserved for accurate reporting

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

**Entry**
| id | transactionId | userId |
|----|---------------|--------|
| E1 | T1 | U1 |

**Operations**
| id | entryId | accountId | account | amount (kopeks) |
|----|---------|-----------|---------|----------------|
| O1 | E1 | A1 | Asset:Cash | -10000 |
| O2 | E1 | A2 | Expense:Food | +10000 |

Balance: `-10000 + 10000 = 0` ✓

**Note**: Amounts are stored as integers (kopeks/cents) to avoid floating-point precision issues.

### Multi-Currency Transaction with Trading Operations

**Scenario**: Buy goods for 9 EUR, pay with cash in USD (10 USD = 1000 cents)

**Transaction**
| id | description | transactionDate | postingDate | userId |
|----|-------------|-----------------|-------------|--------|
| T2 | Buy goods (EUR) | 2025-09-18 | 2025-09-18 | U1 |

**Entry E2 (USD currency pair)**
| id | transactionId | userId |
|----|---------------|--------|
| E2 | T2 | U1 |

**Operations for Entry E2**
| id | entryId | accountId | account | amount (cents) | isSystem |
|----|---------|-----------|---------|----------------|----------|
| O3 | E2 | A3 | Asset:Cash USD | -1000 | false |
| O4 | E2 | A4 | System:Trading:USD | +1000 | true |

Balance (USD): `-1000 + 1000 = 0` ✓

**Entry E3 (EUR currency pair)**
| id | transactionId | userId |
|----|---------------|--------|
| E3 | T2 | U1 |

**Operations for Entry E3**
| id | entryId | accountId | account | amount (cents) | isSystem |
|----|---------|-----------|---------|----------------|----------|
| O5 | E3 | A5 | System:Trading:EUR | -900 | true |
| O6 | E3 | A6 | Expense:Goods | +900 | true |

Balance (EUR): `-900 + 900 = 0` ✓

Trading operations (`isSystem = true`) balance different currencies across separate entries.

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

Entry
- id: UUID
- transactionId: UUID (FK)
- isTombstone: boolean
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Operation
- id: UUID
- entryId: UUID (FK)
- accountId: UUID (FK)
- amount: integer (stored in account's currency, in cents)
- description: string (optional)
- isSystem: boolean (for trading operations)
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