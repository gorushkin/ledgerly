# Ledgerly Domain Model

## Core Concepts

### Transaction
The main entity that represents a financial event. Transactions are built using a hierarchical structure that follows double-entry bookkeeping principles.

#### Hierarchy
```
Transaction (financial event)
  └── Entry (grouping of operations)
      └── Operation (individual account change)
```

#### Key Properties
- Contains one or more **entries**
- Each entry must be balanced (sum of operations = 0)
- Supports split transactions
- Contains metadata (date, description, etc.)
- Must be balanced overall according to double-entry bookkeeping

### Entry
Groups related operations within a transaction to maintain balance.

#### Key Properties
- Belongs to a transaction
- Contains minimum 2 operations (debit and credit sides)
- Sum of all operations must equal zero
- Handles multi-currency operations through trading operations
- Can contain 2 operations (simple case) or 4+ (cross-currency transactions)

### Operation
Represents a single financial entry affecting an account.

#### Key Properties
- Links to an entry and an account
- Amount is always stored in the account's currency
- Positive amount = debit
  - Increases Asset and Expense accounts
  - Decreases Liability, Income, and Equity accounts
- Negative amount = credit
  - Decreases Asset and Expense accounts
  - Increases Liability, Income, and Equity accounts
- Trading operations are created automatically for currency conversion

### Account
Represents different financial accounts with unified structure for all account types.

#### Key Properties
- **Type**: Asset, Liability, Income, Expense, (optional: Equity)
  - **Asset**: Real money (wallet, card, bank account)
  - **Liability**: Debts, loans, credit
  - **Income**: Revenue sources (salary, interest)
  - For Income/Expense: reporting metric (sum of operations over a specified reporting period, not "real money" or all-time cumulative sum)
- Has a designated currency (for Asset/Liability)
- **Balance tracking**:
  - For Asset/Liability: real balance, must match reality
  - For Income/Expense: reporting metric (sum over period), not "real money"
- Balance is calculated from operations

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
2. **Income/Expense accounts**: Balance is calculated as the sum of operations within a specified reporting period, used only for reporting
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

**Scenario**: Buy groceries for 100₽ in cash

**Transaction**
| id | description | date |
|----|-------------|------|
| T1 | Buy groceries | 2025-09-17 |

**Entry**
| id | transactionId | note |
|----|---------------|------|
| E1 | T1 | Groceries at store |

**Operations**
| id | entryId | account | type | amount |
|----|---------|---------|------|--------|
| O1 | E1 | Asset:Cash | Credit | -100₽ |
| O2 | E1 | Expense:Food | Debit | +100₽ |

Balance: `-100 + 100 = 0` ✓

### Multi-Currency Transaction with Trading Operations

**Scenario**: Buy goods for 9 EUR, pay with cash in USD (10 USD)

**Transaction**
| id | description | date |
|----|-------------|------|
| T2 | Buy goods (EUR) | 2025-09-18 |

**Entry**
| id | transactionId | note |
|----|---------------|------|
| E2 | T2 | Goods, payment in USD |

**Operations** (including trading operations)
| id | entryId | account | type | amount |
|----|---------|---------|------|--------|
| O3 | E2 | Asset:Cash USD | Credit | -10 USD |
| O4 | E2 | Trading:USD | Debit | +10 USD |
| O5 | E2 | Trading:EUR | Credit | -9 EUR |
| O6 | E2 | Expense:Goods | Debit | +9 EUR |

Trading operations balance different currencies within the entry.

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
- transactionDate: date
- postingDate: date
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Entry
- id: UUID
- transactionId: UUID (FK)
- description: string
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Operation
- id: UUID
- entryId: UUID (FK)
- accountId: UUID (FK)
- amount: integer (stored in account's currency)
- description: string
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Account
- id: UUID
- name: string
- type: enum (Asset, Liability, Income, Expense)
- currency: string (FK)
- description: string
- userId: UUID (FK)
- createdAt: timestamp
- updatedAt: timestamp

Currency
- code: string (PK)
- name: string
- symbol: string
- createdAt: timestamp
- updatedAt: timestamp

Settings
- userId: UUID (PK, FK)
- baseCurrency: string (FK)
- createdAt: timestamp
- updatedAt: timestamp
```

### Data Types and Conventions
- **Money amounts**: Stored as integers to avoid floating-point precision issues
- **Dates**: ISO datetime strings with branded types (`IsoDatetimeString`)
- **IDs**: UUIDs for all entities
- **Soft deletion**: Uses `isTombstone` flag instead of hard deletes

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