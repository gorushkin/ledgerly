# Ledgerly - Personal Finance Management System

## Overview
Personal finance management application designed for individual users to track their financial activities across multiple accounts and currencies.

For detailed domain model documentation, see [Domain Documentation](./docs/DOMAIN.md)

## Core Features
- Multi-currency support with automatic conversion
- Double-entry bookkeeping system
- Split transactions support
- Multiple account types (cash, credit, debit, etc.)
- Category-based expense tracking

## Domain Concepts

### Transactions & Operations
- **Transaction**: Parent entity that groups related financial operations
- Uses double-entry bookkeeping principles (sum of operations must equal zero)
- Supports split transactions with multiple operations
- Each operation tracks amounts in both original and base currencies

### Accounts
- Represents different financial accounts (cash, bank accounts, credit cards)
- Each account has an associated currency
- Balance is tracked through operations

### Currencies
- Support for multiple currencies
- Each account has a designated currency
- Operations track:
  - Base currency amount (for reporting)
  - Original currency amount (actual transaction amount)
  - Currency conversion handling

### Categories
- Categorizes operations for better financial tracking
- Supports expense and income categorization

## Technical Stack

### Backend
- Node.js 22.14.0
- Fastify
- SQLite with Drizzle ORM
- Zod for validation

### Frontend
- React + TypeScript
- MobX for state management
- TanStack Router
- Tailwind CSS + DaisyUI

### Shared Package
- Common types and validations
- Shared constants and utilities

## Project Structure
```
apps/
  backend/     # Fastify backend application
  frontend/    # React frontend application
packages/
  shared/      # Shared types and validations
```

## Development Setup

### Prerequisites
- Node.js 22.14.0+
- pnpm 10.10.0+

### Installation
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp example.env .env
```

### Development
```bash
# Start backend in development mode
pnpm --filter backend dev

# Start frontend in development mode
pnpm --filter frontend dev
```

### Database
```bash
# Generate migrations
pnpm --filter backend db:generate

# Apply migrations
pnpm --filter backend db:migrate
```

## Architecture Notes
- Uses monorepo structure with pnpm workspaces
- Follows clean architecture principles in backend
- Frontend uses feature-sliced design methodology
- Shared package prevents code duplication between frontend and backend