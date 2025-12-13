# Ledgerly Copilot Instructions

## Project Overview

Personal finance management system implementing **double-entry bookkeeping** with **multi-currency support** (GnuCash-style trading accounts). Built as a monorepo with pnpm workspaces.

## Architecture & Domain Model

### Core Domain Hierarchy (Immutable)

```
Transaction (financial event)
  └── Entry (per-currency balance wrapper)
      └── Operation (account posting)
```

**Critical Rules:**

- **Double-entry**: Every entry must balance to zero (sum of operations = 0)
- **Multi-currency**: Each currency gets its own Entry with system trading accounts (`System:Trading:USD`, etc.)
- **Immutability**: Operations/Entries are never edited—recreate all on transaction updates
- **Amounts**: Always stored as integers (cents) in account's currency; positive = debit, negative = credit

### DDD Architecture Layers

```
domain/           # Pure business logic, Value Objects, Entities
application/      # Use Cases, DTOs, Mappers, Factories
infrastructure/   # Repositories, DB, external services
presentation/     # Fastify controllers, routes, HTTP errors
```

**Key Patterns:**

- **Composition over inheritance**: Entities use `EntityIdentity`, `EntityTimestamps`, `SoftDelete`, `ParentChildRelation` behaviors (see `domain/domain-core/README.md`)
- **Value Objects**: Immutable types (`Id`, `Amount`, `Currency`, `DateValue`, `Email`, etc.) validated at creation
- **Factories**: Create complex aggregates (see `application/services/EntryFactory`, `AccountFactory`, `OperationFactory`)
- **Dependency Injection**: Manual container in `di/container.ts` wires repositories → use cases → controllers

### Error Hierarchy

Errors inherit from `BaseError` with layer-specific subclasses:

- `DomainError`: Business rule violations (e.g., `UnbalancedEntryError`)
- `ApplicationError`: Use case failures (`EntityNotFoundError`, `UnauthorizedAccessError`, `UserAlreadyExistsError`)
- `InfrastructureError`: Data layer issues (`RepositoryNotFoundError`, `ForbiddenAccessError`)
- `HttpApiError`: HTTP-specific (presentation layer only)

Error flow: Domain/Application/Infrastructure → `errorHandler` → HTTP response (see `docs/ERROR_ARCHITECTURE.md`)

## Development Workflows

### Running the Application

```bash
# Both services (uses Makefile):
make dev          # Runs backend + frontend in parallel

# Individual services:
pnpm fe           # Frontend only (alias for --filter frontend dev)
pnpm be           # Backend only (alias for --filter backend dev)

# Database:
pnpm studio       # Open Drizzle Studio
pnpm reset:db     # Delete DB + migrate + seed (for development/testing only)
pnpm seed         # Seed database with test data
```

### Testing

```bash
# Backend (uses Vitest):
pnpm --filter backend test              # Run all tests
pnpm --filter backend test:watch        # Watch mode
pnpm --filter backend test:ui           # UI mode

# Tests are in __tests__/ folders alongside source files
# Integration tests: apps/backend/vitest.integration.config.ts
```

### Database Migrations

```bash
pnpm generate     # Generate migration from schema changes
pnpm migrate      # Apply migrations
pnpm push         # Push schema directly (dev only)
```

**Migration Pattern:** Always use `pnpm generate` after schema changes in `src/db/schema`. Never edit migrations manually.

### Code Quality

```bash
pnpm check        # Run ts-check + lint:fix across all packages
pnpm ts-check     # TypeScript compilation check (no emit)
pnpm lint         # ESLint with auto-fix
```

**Pre-commit:** Husky + lint-staged runs on staged files only.

## Project-Specific Conventions

### TypeScript

- **Use `type` over `interface`** (enforced by ESLint)
- **Path aliases**: `src/*` maps to `apps/backend/src/*` (configured in tsconfig)
- **Strict mode**: All packages use strict TypeScript

### ESLint (see ESLINT_CONFIG.md)

- Base config in `eslint.base.config.js` shared across packages
- Plugins: `perfectionist` (object/import sorting), `unused-imports`, `prettier`
- Backend: Includes Drizzle plugin
- Frontend: Includes React plugins

### Naming Patterns

- **Use Cases**: `{Action}{Entity}UseCase` (e.g., `CreateTransactionUseCase`)
- **Repositories**: `{Entity}Repository` implementing `{Entity}RepositoryInterface`
- **DTOs**: `{Entity}{Request|Response}DTO`
- **Value Objects**: Noun classes in `domain/domain-core/value-objects/`
- **Domain Entities**: `{Entity}.entity.ts` with `.test.ts` alongside

### Database (Drizzle + SQLite)

- Schema in `apps/backend/src/db/schema`
- **Soft deletes**: All entities have `isTombstone` column
- **TransactionManager**: Wrap multi-repository operations in `transactionManager.run()` (see `infrastructure/db/TransactionManager.ts`)
- **ID generation**: Use `saveWithIdRetry` for entity creation to handle ID collisions

### Domain Entity Lifecycle

```typescript
// Creation:
const account = Account.create(user, name, desc, balance, currency, type);

// Persistence:
const insert = account.toPersistence(); // AccountRepoInsert
await repository.create(insert);

// Restoration:
const dbRow = await repository.findById(id);
const account = Account.restore(dbRow);
```

## Key Files to Reference

- **Domain docs**: `docs/DOMAIN.md`, `docs/MULTICURRENCY_DESIGN.md`, `docs/ERROR_ARCHITECTURE.md`
- **Transaction use case**: `apps/backend/src/application/usecases/transaction/CreateTransaction.ts` (shows factory + mapper pattern)
- **Entry validation**: `apps/backend/src/domain/entries/entry.entity.ts` (balance validation logic)
- **DI setup**: `apps/backend/src/di/container.ts` (shows dependency wiring)
- **Value Objects**: `apps/backend/src/domain/domain-core/README.md`

## Common Tasks

### Adding a New Use Case

1. Create class in `application/usecases/{entity}/{action}{Entity}.ts`
2. Inject required repositories/factories via constructor
3. Register in `di/container.ts`
4. Wire to controller in `presentation/controllers/`
5. Add route in `presentation/routes/`
6. Add tests in `__tests__/` alongside

### Adding a New Domain Entity

1. Create `{entity}.entity.ts` in `domain/{entities}/`
2. Use composition: inject `EntityIdentity`, `EntityTimestamps`, `SoftDelete`, `ParentChildRelation`
3. Implement static `create()` and `restore(dbRow)` methods
4. Add `toPersistence()` → `{Entity}RepoInsert`
5. Create repository interface in `application/interfaces/`
6. Implement repository in `infrastructure/db/`
7. Add tests in `{entity}.test.ts`

### Multi-Currency Transaction

When creating transactions across currencies:

- **Entry per currency**: Each currency pair gets its own Entry
- **System accounts**: Automatically created via `AccountFactory.findOrCreateSystemAccount()`
- **Trading operations**: Set `isSystem: true` for balancing operations between trading accounts
- Example: See `EntryFactory.createEntriesWithOperations()` in `application/services/entry.factory.ts`

## Anti-Patterns to Avoid

- ❌ Editing Operations/Entries—always recreate
- ❌ Mixing currencies in one Entry—use separate Entries + trading accounts
- ❌ Direct database queries outside repositories
- ❌ Business logic in controllers or repositories
- ❌ Skipping `transactionManager.run()` for multi-repo operations
- ❌ Using interfaces instead of types (ESLint enforces this)
