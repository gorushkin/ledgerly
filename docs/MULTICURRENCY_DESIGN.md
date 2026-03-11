# Ledgerly Multicurrency Design (GnuCash-Style)

This document describes Ledgerly’s multicurrency model based on **GnuCash Trading Accounts**, adapted for a modern, clean, and immutable backend architecture.

Ledgerly aims to preserve the correctness of double-entry accounting while keeping the system simple and practical for personal finance use.

---

## 1. Overview

Ledgerly uses a **commodity-based** double-entry model:

- Each currency (USD, EUR, RUB) is treated as a separate **commodity**.
- Transactions may contain multiple currencies.
- All operations are **immutable** and represent factual postings.

> **Current implementation state:** The `Entry` wrapper entity has been removed. Operations now belong directly to a transaction. System trading operations and trading accounts are **not yet implemented** — they are planned for a future phase. Balance is currently validated by summing the `value` field across all operations of a transaction (must equal 0).

This model offers the reliability of traditional accounting with the clarity needed for personal finance applications.

---

## 2. Core Principles

### 2.1 Each Currency Is a Separate Commodity
Amounts in different currencies are **not combined** or compared.

Example:  
`100 USD` and `1000 RUB` are independent values.

### 2.2 Per-Currency Balancing
For each currency, the sum of all operations in a transaction must equal **zero**:

```
USD:  -100 + 100 = 0
RUB: +1000 -1000 = 0
```

### 2.3 Double-Entry for Each Currency
Every currency forms its own complete double-entry pair.

### 2.4 Trading Accounts *(planned, not yet implemented)*
The design calls for internal trading accounts:

```
System:Trading:USD
System:Trading:RUB
System:Trading:EUR
...
```

These accounts:

- are **invisible to the user**,
- exist solely to maintain correct double-entry,
- cannot be used manually.

**Current state:** Trading accounts and `isSystem = true` operations are **temporarily deprecated**. They will be introduced in a dedicated multi-currency reconciliation phase.

### 2.5 ~~Entry Wrapper~~ *(removed)*
~~Operations are grouped within **Entries**.~~

The `Entry` entity has been removed from the data model. Operations now belong directly to a transaction via `transactionId`. Any number of operations is valid — balance is checked at the transaction level by summing `value`.

### 2.6 Immutable Operations
Operations cannot be edited.  
If a transaction changes, **all operations are recreated**.

---

## 3. Multicurrency Transaction Model

### Current implementation

Balance is validated at the transaction level: **sum of `value` across all operations must equal zero**. Operations are attached directly to the transaction (no Entry wrapper).

Example — simple expense in RUB:
```
Transaction T1: "Buy groceries"
  Operations:
    Assets:Cash        amount=-10000 RUB  value=-10000
    Expenses:Food      amount=+10000 RUB  value=+10000

Balance: sum(value) = 0 ✓
```

### Planned: full multicurrency with trading accounts

When trading accounts are introduced, Ledgerly will generate **balancing postings** for each currency. Example — exchange 100 USD → 1000 RUB:

```
Transaction T2: "Exchange USD to RUB"
  Operations:
    Assets:WalletUSD       amount=-100 USD   value=-100   isSystem=false
    System:Trading:USD     amount=+100 USD   value=+100   isSystem=true
    System:Trading:RUB     amount=-1000 RUB  value=+100   isSystem=true
    Assets:WalletRUB       amount=+1000 RUB  value=-100   isSystem=false

Balance: sum(value) = 0 ✓
```

No FX conversion or base currency is required at this level.

---

## 4. Trading Accounts Explained *(planned)*

Trading accounts will maintain double-entry correctness for each currency.

Without them:

```
-100 USD + 1000 RUB ≠ 0
```

With trading accounts, each commodity balances independently:

```
USD world: 0
RUB world: 0
```

Trading accounts will never be displayed to the user.

**Not yet implemented.** Currently, only same-currency or explicitly balanced multi-currency transactions are supported.

---

## 5. Data Structure

### Transaction
Top-level entity representing a financial event:
- `id`, `userId`, `description`
- `currency` (base currency for the transaction — determines `value` denomination)
- `transactionDate`, `postingDate`
- `version` (optimistic concurrency)
- `createdAt`, `updatedAt`, `isTombstone`

### Operation
Individual account posting:
- `id`, `transactionId`, `accountId`, `userId`
- `amount` (signed integer, in **account's currency**)
- `value` (signed integer, in **transaction's currency**)
- `description` (optional)
- `isSystem` (true for trading postings)
- `createdAt`, `updatedAt`, `isTombstone`

#### `amount` vs `value` — GnuCash convention

This follows the standard GnuCash split model:

| Field | Currency | Purpose |
|-------|----------|---------|
| `amount` | Account's native currency | How much was posted to this account |
| `value` | Transaction's currency | The equivalent amount in the transaction's denomination |

For **same-currency** transactions both fields are equal.

For **cross-currency** transactions they differ:

```
Transaction currency: USD
  Operation on Assets:WalletRUB
    amount = -1000  (RUB — account's currency)
    value  =   -10  (USD — transaction's currency)
```

**Balance validation** is performed on `value`: the sum of `value` across all operations of a transaction must equal zero, regardless of how many currencies are involved.

Notes:
- Currency is determined by the account.
- Operations are immutable.
- Normal operations have `isSystem = false`.
- Trading operations have `isSystem = true`.

---

## 6. Transaction Examples

### 6.1 Salary (+100 USD)

**Transaction T1:**
```
  Assets:WalletUSD     amount=+100 USD  value=+100
  Income:Salary        amount=-100 USD  value=-100
```

Balance: sum(value) = +100 - 100 = 0 ✓

### 6.2 Exchange 100 USD → 1000 RUB *(requires trading accounts — not yet implemented)*

**Transaction T2 (future):**
```
  Assets:WalletUSD       amount=-100 USD   value=-100   isSystem=false
  System:Trading:USD     amount=+100 USD   value=+100   isSystem=true
  System:Trading:RUB     amount=-1000 RUB  value=+100   isSystem=true
  Assets:WalletRUB       amount=+1000 RUB  value=-100   isSystem=false
```

Balance: sum(value) = 0 ✓

### 6.3 Expense in EUR

**Transaction T3:**
```
  Expenses:Coffee      amount=+5 EUR  value=+5
  Assets:WalletEUR     amount=-5 EUR  value=-5
```

Balance: sum(value) = +5 - 5 = 0 ✓

---

## 7. What Ledgerly Does *Not* Implement

To avoid unnecessary complexity:

- ❌ No cost basis  
- ❌ No lot tracking  
- ❌ No FIFO/LIFO  
- ❌ No FX gains/losses  
- ❌ No asset revaluation  
- ❌ No PTA-style price entries

These can be added later if Ledgerly evolves toward investment tracking.

Currently, Ledgerly stays closer to GnuCash than to PTA.

---

## 8. Why This Model Is Ideal

- ✔ True double-entry accounting  
- ✔ Correct multicurrency support  
- ✔ Immutable operations  
- ✔ Backend is simple and predictable  
- ✔ UI can stay minimal (Actual-style)  
- ✔ No PTA-level complexity required  
- ✔ Easily testable and extendable

---

## 9. Summary

### Current implementation

- **Transaction → Operation** hierarchy (Entry removed)  
- Any number of operations per transaction  
- Balance validated by `sum(value) = 0` across all operations  
- Immutable ledger operations  
- `amount` = account currency; `value` = transaction currency (GnuCash convention)  

### Planned

- GnuCash-style trading accounts (`System:Trading:*`)  
- `isSystem = true` operations for automatic currency reconciliation  
- Per-currency double-entry balancing  

This foundation ensures correctness, extensibility, and simplicity for all future Ledgerly features.