# Error Architecture

## Hierarchy

All application errors inherit from a single base class to enable consistent error handling across layers.

```
BaseError (shared/errors)
├── DomainError (domain)
│   └── UnbalancedEntryError
├── ApplicationError (application)
│   ├── EntityNotFoundError
│   ├── UnauthorizedAccessError
│   ├── UserNotFoundError
│   ├── InvalidPasswordError
│   └── UserAlreadyExistsError
├── InfrastructureError (infrastructure)
│   ├── RepositoryNotFoundError
│   ├── ForbiddenAccessError
│   └── DatabaseError
└── HttpApiError (presentation)
    └── AuthErrors
        └── UnauthorizedError
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
- **Purpose**: Use case failures and authentication/authorization
- **Examples**:
  - `EntityNotFoundError` - Entity doesn't exist
  - `UnauthorizedAccessError` - User doesn't own entity
  - `UserNotFoundError` - User not found during login (401)
  - `InvalidPasswordError` - Invalid password during login (401)
  - `UserAlreadyExistsError` - Duplicate user registration (409)
- **Characteristics**:
  - Orchestration failures
  - Cross-entity rules
  - Authentication/authorization business logic
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
- **Purpose**: HTTP-specific errors for REST API and middleware
- **Contains**: statusCode, message
- **Examples**:
  - `AuthErrors` - middleware authentication errors
    - `UnauthorizedError` (401) - Missing/invalid token
- **Characteristics**:
  - HTTP status codes
  - REST API specific
  - Presentation layer only
  - Used by middleware for HTTP-level auth
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
   - ApplicationError → 401/403/404/409
     * UserNotFoundError → 401
     * InvalidPasswordError → 401
     * UserAlreadyExistsError → 409
     * EntityNotFoundError → 404
     * UnauthorizedAccessError → 403
   - InfrastructureError → 404/403/500
     * RepositoryNotFoundError → 404
     * ForbiddenAccessError → 403
     * DatabaseError → 500
   - HttpApiError → Uses error.statusCode
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
// application/usecases/auth/loginUser.ts
import { UserNotFoundError, InvalidPasswordError } from 'src/application/application.errors';

if (!userWithPassword) {
  throw new UserNotFoundError();
}

if (!isPasswordValid) {
  throw new InvalidPasswordError();
}
```

```typescript
// application/usecases/auth/registerUser.ts
import { UserAlreadyExistsError } from 'src/application/application.errors';

if (existingUser) {
  throw new UserAlreadyExistsError();
}
```

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
import { 
  UserNotFoundError, 
  InvalidPasswordError, 
  UserAlreadyExistsError,
  EntityNotFoundError,
  UnauthorizedAccessError 
} from 'src/application/application.errors';
import { 
  RepositoryNotFoundError, 
  ForbiddenAccessError 
} from 'src/infrastructure/infrastructure.errors';

// Map application auth errors
if (error instanceof UserNotFoundError) {
  return reply.status(401).send({ error: true, message: error.message });
}

if (error instanceof InvalidPasswordError) {
  return reply.status(401).send({ error: true, message: error.message });
}

if (error instanceof UserAlreadyExistsError) {
  return reply.status(409).send({ error: true, message: error.message });
}

// Map application entity errors
if (error instanceof EntityNotFoundError) {
  return reply.status(404).send({ error: true, message: error.message });
}

if (error instanceof UnauthorizedAccessError) {
  return reply.status(403).send({ error: true, message: error.message });
}

// Map infrastructure errors
if (error instanceof RepositoryNotFoundError) {
  return reply.status(404).send({ error: true, message: error.message });
}

if (error instanceof ForbiddenAccessError) {
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
// Only for middleware HTTP-level authentication
class UnauthorizedError extends HttpApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export const AuthErrors = {
  UnauthorizedError,
};
```

**Note**: Auth business logic errors (UserNotFoundError, InvalidPasswordError, UserAlreadyExistsError) are in Application layer, not Presentation.

## Important Notes

### Clean Architecture Compliance

**✅ CORRECT: Application throws application errors**
```typescript
// application/usecases/auth/loginUser.ts
import { UserNotFoundError } from 'src/application/application.errors';

if (!user) {
  throw new UserNotFoundError();
}
```

**✅ CORRECT: Infrastructure throws infrastructure errors**
```typescript
// infrastructure/db/AccountRepository.ts
import { RepositoryNotFoundError } from '../infrastructure.errors';

if (!account) {
  throw new RepositoryNotFoundError(`Account not found`);
}
```

**❌ WRONG: Application throwing presentation errors**
```typescript
// application/usecases/auth/loginUser.ts
import { AuthErrors } from 'src/presentation/errors/auth.errors';

if (!user) {
  throw new AuthErrors.UserNotFoundError(); // VIOLATES ARCHITECTURE!
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
- **Application**: Can use Domain errors only (never Infrastructure or Presentation)
- **Infrastructure**: Should only throw Infrastructure errors (never Presentation)
- **Presentation**: Can catch and transform any error type to HTTP response

## Benefits