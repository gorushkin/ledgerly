# Error Architecture

## Hierarchy

All application errors inherit from a single base class to enable consistent error handling across layers.

```
BaseError (shared/errors)
├── DomainError (domain)
│   └── UnbalancedEntryError
├── ApplicationError (application)
│   ├── EntityNotFoundError
│   └── UnauthorizedAccessError
├── InfrastructureError (infrastructure)
│   ├── RepositoryNotFoundError
│   ├── ForbiddenAccessError
│   └── DatabaseError
└── HttpApiError (presentation)
    └── AuthErrors
        ├── UnauthorizedError
        ├── UserNotFoundError
        └── EmailAlreadyExistsError
```

## Layer Responsibilities

### BaseError (`shared/errors/BaseError.ts`)
- **Purpose**: Root of all application errors
- **Contains**: message, cause (optional)
- **Does NOT contain**: HTTP status codes or layer-specific details
- **Used by**: All layers

### DomainError (`domain/domain.errors.ts`)
- **Purpose**: Business rule violations and domain invariants
- **Examples**: 
  - `UnbalancedEntryError` - Entry operations don't sum to zero
- **Characteristics**:
  - Pure business logic
  - No infrastructure concerns
  - No HTTP details

### ApplicationError (`application/application.errors.ts`)
- **Purpose**: Use case failures
- **Examples**:
  - `EntityNotFoundError` - Entity doesn't exist
  - `UnauthorizedAccessError` - User doesn't own entity
- **Characteristics**:
  - Orchestration failures
  - Cross-entity rules
  - No infrastructure details

### InfrastructureError (`infrastructure/infrastructure.errors.ts`)
- **Purpose**: External system failures
- **Examples**:
  - `RepositoryNotFoundError` - Database record not found
  - `ForbiddenAccessError` - User tries to access resource they don't own
  - `DatabaseError` - Low-level database errors
  - `ExternalApiError` - Third-party API failure
- **Characteristics**:
  - Database errors
  - File system errors
  - External service errors
  - Access control at data layer

### HttpApiError (`presentation/errors/HttpError.ts`)
- **Purpose**: HTTP-specific errors for REST API
- **Contains**: statusCode, message
- **Examples**:
  - `AuthErrors` - authentication/authorization errors
    - `UnauthorizedError` (401)
    - `UserNotFoundError` (404)
    - `EmailAlreadyExistsError` (409)
- **Characteristics**:
  - HTTP status codes
  - REST API specific
  - Presentation layer only
  - Maps domain/application/infrastructure errors to HTTP responses

## Error Flow

```
1. Domain/Application/Infrastructure throws specific error
                    ↓
2. Error propagates up through layers
                    ↓
3. errorHandler (presentation) catches error
                    ↓
4. Maps to appropriate HTTP response
   - DomainError → 400 (Bad Request)
   - ApplicationError → 404/403 (Not Found/Forbidden)
   - InfrastructureError → 500/404 (Server Error/Not Found)
   - AppError → Uses error.statusCode
```

## Usage Examples

### Domain Layer
```typescript
// domain/entries/entry.entity.ts
import { UnbalancedEntryError } from '../domain.errors';

validateBalance(): void {
  if (!total.isZero()) {
    throw new UnbalancedEntryError(this.getId().valueOf(), total);
  }
}
```

### Application Layer
```typescript
// application/shared/ensureEntityExistsAndOwned.ts
import { EntityNotFoundError, UnauthorizedAccessError } from '../application.errors';

if (!entity) {
  throw new EntityNotFoundError('Account');
}

if (!user.verifyOwnership(entity.userId)) {
  throw new UnauthorizedAccessError('Account');
}
```

### Infrastructure Layer
```typescript
// infrastructure/db/AccountRepository.ts
import { RepositoryNotFoundError, ForbiddenAccessError } from '../infrastructure.errors';

if (!account) {
  throw new RepositoryNotFoundError(`Account with ID ${id} not found`);
}

if (account.userId !== userId) {
  throw new ForbiddenAccessError('You do not have permission to access this account');
}
```

### Presentation Layer
```typescript
// libs/errorHandler.ts
import { DomainError } from 'src/domain/domain.errors';
import { ApplicationError } from 'src/application/application.errors';
import { InfrastructureError, RepositoryNotFoundError, ForbiddenAccessError } from 'src/infrastructure/infrastructure.errors';

// Map infrastructure errors to HTTP responses
if (error instanceof RepositoryNotFoundError) {
  return reply.status(404).send({ error: true, message: error.message });
}

if (error instanceof ForbiddenAccessError) {
  return reply.status(403).send({ error: true, message: error.message });
}

// Map application errors
if (error instanceof EntityNotFoundError) {
  return reply.status(404).send({ error: true, message: error.message });
}

if (error instanceof UnauthorizedAccessError) {
  return reply.status(403).send({ error: true, message: error.message });
}
```

## Benefits

1. **Single Source of Truth**: All errors inherit from `BaseError`
2. **Type Safety**: TypeScript can check error types across layers
3. **Consistent Handling**: errorHandler can handle any `BaseError`
4. **Layer Independence**: Domain/Application don't depend on HTTP details
5. **Testing**: Easy to test error handling without HTTP concerns
6. **Extensibility**: Easy to add new error types at any layer

## Adding New Errors

### Domain Error
```typescript
// domain/domain.errors.ts
export class InvalidAccountBalanceError extends DomainError {
  constructor(accountId: string, balance: string) {
    super(`Account ${accountId} has invalid balance: ${balance}`);
  }
}
```

### Application Error
```typescript
// application/application.errors.ts
export class DuplicateEntityError extends ApplicationError {
  constructor(entityName: string) {
    super(`${entityName} already exists`);
  }
}
```

### Infrastructure Error
```typescript
// infrastructure/infrastructure.errors.ts
export class ForbiddenAccessError extends InfrastructureError {
  constructor(message: string) {
    super(message);
  }
}
```

### Presentation Error (HTTP-specific)
```typescript
// presentation/errors/auth.errors.ts
export class UserNotFoundError extends HttpApiError {
  constructor(message: string = 'User not found') {
    super(message, 404);
  }
}
```

## Important Notes

### Clean Architecture Compliance

**✅ CORRECT: Infrastructure throws infrastructure errors**
```typescript
// infrastructure/db/AccountRepository.ts
import { RepositoryNotFoundError } from '../infrastructure.errors';

if (!account) {
  throw new RepositoryNotFoundError(`Account not found`);
}
```

**❌ WRONG: Infrastructure throwing presentation errors**
```typescript
// infrastructure/db/AccountRepository.ts
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';

if (!account) {
  throw new NotFoundError(`Account not found`); // VIOLATES ARCHITECTURE!
}
```

### Layer Dependencies

- **Domain**: No dependencies on other layers
- **Application**: Can use Domain errors
- **Infrastructure**: Should only throw Infrastructure errors
- **Presentation**: Can catch and transform any error type to HTTP response