# Ledgerly Multicurrency Design (GnuCash-Style)

This document describes Ledgerly’s multicurrency model based on **GnuCash Trading Accounts**, adapted for a modern, clean, and immutable backend architecture.

Ledgerly aims to preserve the correctness of double-entry accounting while keeping the system simple and practical for personal finance use.

---

## 1. Overview

Ledgerly uses a **commodity-based** double-entry model:

- Each currency (USD, EUR, RUB) is treated as a separate **commodity**.
- Transactions may contain multiple currencies.
- Ledgerly guarantees **per-currency balance** using GnuCash-style **trading accounts**.
- All operations are **immutable** and represent factual postings.

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

### 2.4 Trading Accounts
Ledgerly creates internal trading accounts:

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

### 2.5 Entry Wrapper
Operations are grouped within **Entries**.  
Each Entry maintains balance for one currency pair.  
For multicurrency transactions, multiple Entries are created (one per currency).

### 2.6 Immutable Operations
Operations cannot be edited.  
If a transaction changes, **all operations are recreated**.

---

## 3. Multicurrency Transaction Model

When a transaction uses multiple currencies, Ledgerly generates **balancing postings** for each currency.

### Example  
Exchange: **100 USD → 1000 RUB**

**Transaction:**
```
Transaction T1: "Exchange USD to RUB"
```

**Entry E1 (USD currency pair):**
```
Assets:WalletUSD         -100 USD
System:Trading:USD       +100 USD
```

**Entry E2 (RUB currency pair):**
```
System:Trading:RUB      -1000 RUB
Assets:WalletRUB        +1000 RUB
```

### Entry Balances:
```
Entry E1 (USD): -100 + 100 = 0 ✓
Entry E2 (RUB): -1000 + 1000 = 0 ✓
```

Each entry is independently balanced.

No FX conversion or base currency is required at this level.

---

## 4. Trading Accounts Explained

Trading accounts maintain double-entry correctness for each currency.

Without them:

```
-100 USD + 1000 RUB ≠ 0
```

With trading accounts, each commodity balances independently:

```
USD world: 0
RUB world: 0
```

Trading accounts are never displayed to the user.

---

## 5. Data Structure

### Transaction
Top-level entity representing a financial event:
- `id`, `userId`, `description`
- `transactionDate`, `postingDate`
- `createdAt`, `updatedAt`, `isTombstone`

### Entry
Groups operations to maintain per-currency balance:
- `id`, `transactionId`, `userId`
- `createdAt`, `updatedAt`, `isTombstone`
- Contains 2+ operations that must sum to zero

### Operation
Individual account posting:
- `id`, `entryId`, `accountId`, `userId`
- `amount` (signed integer, in account's currency)
- `description` (optional)
- `isSystem` (true for trading postings)
- `createdAt`, `updatedAt`, `isTombstone`

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
Entry E1:
  Assets:WalletUSD     +100 USD
  Income:Salary        -100 USD
```

Entry balance: +100 - 100 = 0 ✓

### 6.2 Exchange 100 USD → 1000 RUB

**Transaction T2:**
```
Entry E1 (USD):
  Assets:WalletUSD        -100 USD
  System:Trading:USD      +100 USD

Entry E2 (RUB):
  System:Trading:RUB     -1000 RUB
  Assets:WalletRUB       +1000 RUB
```

Entry balances:
- E1: -100 + 100 = 0 ✓
- E2: -1000 + 1000 = 0 ✓

### 6.3 Expense in EUR

**Transaction T3:**
```
Entry E1:
  Expenses:Coffee         +5 EUR
  Assets:WalletEUR        -5 EUR
```

Entry balance: +5 - 5 = 0 ✓

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

Ledgerly implements:

- **Transaction → Entry → Operation** hierarchy  
- GnuCash-style trading accounts  
- per-currency double-entry balancing within entries  
- immutable ledger operations  
- invisible system trading accounts  

This foundation ensures correctness, extensibility, and simplicity for all future Ledgerly features.