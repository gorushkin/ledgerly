# 📊 Database Schema - Ledgerly

Database schema documentation for Ledgerly financial tracker.

## 🎯 Overview

Ledgerly uses SQLite with Drizzle ORM for personal finance management. The architecture is built on these principles:
- **User data isolation** - all data is tied to userId
- **Double-entry bookkeeping** - operations belong directly to transactions
- **Multi-currency support** - different currencies with trading accounts
- **Cascade deletions** - data integrity
- **Soft deletes** - using `isTombstone` flag

## 📋 Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK "unique"
        string name
        string password
        timestamp createdAt
        timestamp updatedAt
    }
    
    CURRENCIES {
        string code PK "USD, EUR, RUB"
        string name
        string symbol
    }
    
    ACCOUNTS {
        uuid id PK
        string name
        string type "Asset|Liability|Income|Expense"
        string currency FK
        string description
        integer initialBalance
        integer currentClearedBalanceLocal
        boolean isSystem
        boolean isTombstone
        uuid userId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    TRANSACTIONS {
        uuid id PK
        string description
        string currency
        date transactionDate
        date postingDate
        integer version
        boolean isTombstone
        uuid userId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    OPERATIONS {
        uuid id PK
        uuid transactionId FK
        uuid accountId FK
        integer amount
        integer value
        string description
        boolean isSystem
        boolean isTombstone
        uuid userId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    SETTINGS {
        uuid userId PK,FK
        string baseCurrency FK
        timestamp createdAt
        timestamp updatedAt
    }

    %% Main relations
    USERS ||--o{ ACCOUNTS : "owns"
    USERS ||--o{ TRANSACTIONS : "makes"
    USERS ||--o{ OPERATIONS : "performs"
    USERS ||--|| SETTINGS : "has"
    
    CURRENCIES ||--o{ ACCOUNTS : "denominated_in"
    CURRENCIES ||--o{ SETTINGS : "base_currency"
    
    TRANSACTIONS ||--o{ OPERATIONS : "contains"
    ACCOUNTS ||--o{ OPERATIONS : "affects"
    
    %% Unique constraints
    ACCOUNTS }|--|| USERS : "unique(userId, name)"
```

## 🏗️ Entities

### 🏦 **Users**
Base entity for authentication and authorization.

| Field | Type | Description | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Primary key | PK, NOT NULL |
| `email` | String | User email | UNIQUE, NOT NULL |
| `name` | String | User name | NOT NULL |
| `password` | String | Hashed password | NOT NULL |
| `createdAt` | Timestamp | Creation date | NOT NULL |
| `updatedAt` | Timestamp | Last update date | NOT NULL |

**Relations:**
- `1:N` with `accounts` (cascade delete)
- `1:N` with `transactions` (cascade delete)
- `1:N` with `operations` (cascade delete)
- `1:1` with `settings`

---

### 💰 **Accounts**
User's financial accounts for tracking funds.

| Field | Type | Description | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Primary key | PK, NOT NULL |
| `name` | String | Account name | NOT NULL |
| `type` | Enum | Account type | `Asset\|Liability\|Income\|Expense` |
| `currency` | String | Account currency | NOT NULL (CurrencyCode) |
| `description` | String | Account description | NULLABLE |
| `initialBalance` | Integer | Initial balance (in cents) | NOT NULL, default: 0 |
| `currentClearedBalanceLocal` | Integer | Current balance (in cents) | NOT NULL, default: 0 |
| `isSystem` | Boolean | System account flag (for trading accounts) | NOT NULL, default: false |
| `isTombstone` | Boolean | Soft delete flag | NOT NULL, default: false |
| `userId` | UUID | Account owner | FK → `users.id` |
| `createdAt` | Timestamp | Creation date | NOT NULL |
| `updatedAt` | Timestamp | Last update date | NOT NULL |

**Constraints:**
- `UNIQUE(userId, name)` - unique name per user

**Relations:**
- `N:1` with `users`
- `1:N` with `operations`

**Notes:**
- Currency constraint to `currencies` table is removed for test performance
- Application-level validation should ensure valid currency codes
- Money amounts stored as integers (cents) to avoid floating-point issues
- System accounts (trading accounts) have `isSystem = true`

---

### 💱 **Currencies**
Dictionary of supported currencies.

> Design note: this table is an MVP currency dictionary, not the final identity
> model for all monetary units. Ledgerly is expected to need an asset/commodity
> registry for fiat currencies, crypto assets, network-specific tokens, and
> custom user assets before final transaction currency existence validation is
> implemented. See
> [ADR 0006](./architecture/adr/0006-asset-registry-before-currency-validation.md).

| Field | Type | Description | Constraints |
|------|-----|----------|-------------|
| `code` | String | Currency code (ISO 4217) | PK, NOT NULL |
| `name` | String | Full name | NOT NULL |
| `symbol` | String | Currency symbol | NOT NULL |

**Examples:**
- `USD` - United States Dollar - `$`
- `EUR` - Euro - `€`
- `RUB` - Russian Ruble - `₽`

**Relations:**
- `1:N` with `accounts`
- `1:N` with `settings`

---

### 📝 **Transactions**
Top-level grouping of related financial events.

| Field | Type | Description | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Primary key | PK, NOT NULL |
| `description` | String | Transaction description | NOT NULL |
| `currency` | String | Base currency of the transaction | NOT NULL (CurrencyCode) |
| `transactionDate` | Date | Transaction date | NOT NULL |
| `postingDate` | Date | Posting date | NOT NULL |
| `version` | Integer | Optimistic concurrency version | NOT NULL, default: 0 |
| `isTombstone` | Boolean | Soft delete flag | NOT NULL, default: false |
| `userId` | UUID | Transaction owner | FK → `users.id` |
| `createdAt` | Timestamp | Creation date | NOT NULL |
| `updatedAt` | Timestamp | Last update date | NOT NULL |

**Relations:**
- `N:1` with `users`
- `1:N` with `operations` (cascade delete)

**Indexes:**
- `idx_transactions_user_date` on `(userId, transactionDate)`

**Notes:**
- `currency` is the base/reporting currency for the entire transaction; used to compute `value` on each operation
- `version` supports optimistic concurrency control—increment on every update

---

### 🔄 **Operations**
Individual financial postings affecting accounts.

| Field | Type | Description | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Primary key | PK, NOT NULL |
| `transactionId` | UUID | Parent transaction | FK → `transactions.id` |
| `accountId` | UUID | Affected account | FK → `accounts.id` |
| `amount` | Integer | Amount in **account's** currency (cents) | NOT NULL |
| `value` | Integer | Amount in **transaction's** currency (cents) | NOT NULL |
| `description` | String | Operation description | NULLABLE |
| `isSystem` | Boolean | System operation flag (for trading ops) | NOT NULL, default: false |
| `isTombstone` | Boolean | Soft delete flag | NOT NULL, default: false |
| `userId` | UUID | Operation owner | FK → `users.id` |
| `createdAt` | Timestamp | Creation date | NOT NULL |
| `updatedAt` | Timestamp | Last update date | NOT NULL |

**Relations:**
- `N:1` with `transactions` (cascade delete)
- `N:1` with `accounts` (restrict delete)
- `N:1` with `users`

**Business Rules:**
- `amount` is always in the account's native currency
- `value` is in the transaction's base currency (equal to `amount` for same-currency transactions)
- Positive = debit (increases Asset/Expense, decreases Liability/Income)
- Negative = credit (decreases Asset/Expense, increases Liability/Income)
- System operations (trading operations) have `isSystem = true`
- Balance check: `sum(value)` across all operations in a transaction must equal 0

**Indexes:**
- `idx_operations_transaction` on `transactionId`
- `idx_operations_account` on `accountId`
- `idx_operations_user` on `userId`

---

### ⚙️ **Settings**
User application settings.

| Field | Type | Description | Constraints |
|------|-----|----------|-------------|
| `userId` | UUID | User | PK, FK → `users.id` |
| `baseCurrency` | String | Base currency for reporting | FK → `currencies.code`, default: 'RUB' |
| `createdAt` | Timestamp | Creation date | NOT NULL |
| `updatedAt` | Timestamp | Last update date | NOT NULL |

**Relations:**
- `1:1` with `users`
- `N:1` with `currencies`

---

## 🔗 Relationships

### Data Hierarchy
```
USERS (root entity)
├── ACCOUNTS (financial accounts)
├── TRANSACTIONS (financial events)
│   └── OPERATIONS (individual postings)
└── SETTINGS (user preferences)
```

### Entity Relations
- **Users ↔ Accounts**: `1:N` with cascade delete
- **Users ↔ Transactions**: `1:N` with cascade delete
- **Users ↔ Operations**: `1:N` with cascade delete
- **Users ↔ Settings**: `1:1`
- **Transactions ↔ Operations**: `1:N` with cascade delete
- **Accounts ↔ Operations**: `1:N` (restrict delete)
- **Currencies ↔ Accounts**: `1:N`
- **Currencies ↔ Settings**: `1:N`

---

## 💡 Business Rules

### Uniqueness
1. **User email** must be unique system-wide
2. **Account name** must be unique per user

### Data Integrity
1. **Cascade deletions**: When a user is deleted, all their data is deleted
2. **Required relations**: Each operation must have a transaction and account
3. **Currency constraints**: All accounts reference existing currencies (application-level)
4. **Soft deletes**: Entities use `isTombstone` flag instead of hard deletes

### Accounting Principles
1. **Double-entry bookkeeping**: `sum(value)` across all operations in a transaction must equal 0
2. **Multi-currency support**: Handled through `amount` (account currency) + `value` (transaction currency) and trading accounts
3. **Immutable operations**: Operations cannot be edited, only recreated on transaction updates

---

## 🚀 Schema Files

Schemas are defined in the following files:
- `apps/backend/src/db/schemas/users.ts` - Users
- `apps/backend/src/db/schemas/accounts.ts` - Accounts
- `apps/backend/src/db/schemas/currencies.ts` - Currencies
- `apps/backend/src/db/schemas/transactions.ts` - Transactions
- `apps/backend/src/db/schemas/operations.ts` - Operations
- `apps/backend/src/db/schemas/settings.ts` - Settings

All schemas are exported through `apps/backend/src/db/schema.ts`.

---

*Last updated: March 11, 2026*
