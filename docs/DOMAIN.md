# Ledgerly Domain Model

## Core Concepts

### Transaction
The main entity that represents a financial event. Each transaction must be balanced according to double-entry bookkeeping principles.

#### Key Properties
- Can contain multiple operations
- Sum of all operations must equal zero
- Supports split transactions
- Contains metadata (date, description, etc.)

### Operation
Represents a single financial entry within a transaction.

#### Key Properties
- Links to an account and category
- Contains amounts:
  - Local amount (in account's currency)
  - Original amount (in transaction currency)
- Tracks currencies:
  - Base currency (for reporting)
  - Original currency (from account)

### Account
Represents a financial account that can hold money.

#### Key Properties
- Has a designated currency
- Maintains current balance
- Types: cash, bank account, credit card, etc.
- Balance is calculated from operations

### Category
Used to classify operations for reporting and analysis.

#### Key Properties
- Can be income or expense
- Used for budgeting and reporting
- Helps track spending patterns

### Currency
Represents different monetary units used in the system.

#### Key Properties
- Each account has a designated currency
- System has a base currency for reporting
- Conversion rates are tracked for accurate reporting

## Business Rules

### Double-Entry Bookkeeping
1. Each transaction must have at least two operations
2. Sum of all operations within a transaction must equal zero
3. Positive amount represents incoming money (credit)
4. Negative amount represents outgoing money (debit)

### Currency Handling
1. Each operation stores amounts in:
   - Account's currency (original)
   - System's base currency (for reporting)
2. Currency conversion happens at the time of operation
3. Historical rates should be stored for accurate reporting

### Account Balance
1. Balance is always in account's currency
2. Calculated as sum of all operations
3. Should match real-world balance

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
- createdAt: timestamp
- updatedAt: timestamp

Operation
- id: UUID
- transactionId: UUID (FK)
- accountId: UUID (FK)
- categoryId: UUID (FK)
- localAmount: decimal
- originalAmount: decimal
- baseCurrency: string (FK)
- originalCurrency: string (FK)
- description: string
- createdAt: timestamp
- updatedAt: timestamp

Account
- id: UUID
- name: string
- currency: string (FK)
- type: enum
- balance: decimal
- createdAt: timestamp
- updatedAt: timestamp

Category
- id: UUID
- name: string
- type: enum
- createdAt: timestamp
- updatedAt: timestamp

Currency
- code: string (PK)
- name: string
- symbol: string
- createdAt: timestamp
- updatedAt: timestamp
```

## Future Improvements

### Currency Handling
Currently, currency information is stored in operations, but it could be optimized:
1. Base currency could be moved to system settings
2. Original currency could be derived from account
3. Only amounts would need to be stored in operations

### Planned Features
1. Budget tracking
2. Currency rate caching
3. Automatic currency conversion
4. Category-based reports
5. Balance forecasting

## Architecture Notes
1. Uses clean architecture principles
2. Domain logic is separated from infrastructure
3. Validation happens at multiple levels:
   - Schema validation (Zod)
   - Domain validation (business rules)
   - Database constraints (Drizzle)
4. API layer uses Fastify for:
   - Route handling
   - Request validation
   - Error handling
   - Response serialization