# Error Architecture

## Hierarchy

Internal custom errors thrown by domain, application, infrastructure and HTTP
presentation code inherit from `BaseError`. External errors such as `ZodError`
and unexpected thrown values do not have to follow this hierarchy, but the HTTP
boundary still handles them safely.

Only expected public failures carry API response codes and allowlisted context.

```text
BaseError (shared/errors)
├── DomainError (domain)
├── ApplicationError (application)
├── InfrastructureError (infrastructure)
├── DatabaseError (infrastructure/db)
└── HttpApiError (presentation/http/errors)
    └── UnauthorizedError
```

`CodedError` mixins in domain, application and infrastructure expose stable
`ApiErrorCode` values and typed public context. They do not expose HTTP status
codes.

## Layer Responsibilities

### Shared

`BaseError` is the common diagnostic base class. `CodedError` and
`isCodedError` define the transport-independent public error contract used by
presentation adapters.

Shared errors do not know about HTTP, Fastify or response serialization.

### Domain

Domain errors represent invariant and value-object failures. They may expose a
stable API code and context, but they do not decide how that code is transported.

Examples include invalid amounts, invalid identifiers, transaction balance
violations, operation ownership mismatches and closed-account lifecycle
violations such as `ClosedAccountOperationError`.

### Application

Application errors represent use-case failures and authorization decisions at
the orchestration boundary.

Examples include:

- `EntityNotFoundError`
- `EntityAlreadyExistsError`
- `UnauthorizedAccessError`
- `UserNotFoundError`
- `InvalidCredentialsError`
- `VersionConflictError`
- `CommodityClosedError`

Authentication failures intentionally map to the same public
`AUTHENTICATION_FAILED` code with empty context.

Known duplicate entity conflicts use `EntityAlreadyExistsError` with
allowlisted context such as `{ entityType: "account", field: "name" }`.

### Infrastructure

Infrastructure errors represent persistence, database and external-system
failures.

Expected repository failures such as `RepositoryNotFoundError` and
`ForbiddenAccessError` are coded and may expose allowlisted context. Lower-level
database errors are diagnostic only and are serialized as
`INTERNAL_SERVER_ERROR`.

Infrastructure must not throw presentation-layer errors.

### HTTP Presentation

The backend HTTP adapter owns HTTP error translation under:

```text
apps/backend/src/presentation/http/
├── error-handler.ts
└── errors/
```

`error-handler.ts` is the Fastify error boundary. It translates:

- `ZodError` to `VALIDATION_FAILED`
- coded domain/application/infrastructure errors to API responses
- `DatabaseError` to `INTERNAL_SERVER_ERROR` after diagnostic reporting
- `HttpApiError` subclasses to their HTTP-specific status and code
- unknown errors to `INTERNAL_SERVER_ERROR`

`HttpApiError` and concrete subclasses are for HTTP adapter concerns only, such
as middleware authentication. Domain, application and infrastructure code should
not import them.

Public imports from outside the HTTP module should go through:

```typescript
import {
  HttpApiError,
  UnauthorizedError,
  errorHandler,
} from "src/presentation/http";
```

## HTTP Response Contract

Public API error responses use stable codes and allowlisted context:

```json
{
  "error": true,
  "code": "ENTITY_NOT_FOUND",
  "context": {
    "entityType": "account"
  }
}
```

Diagnostic `message`, stack traces, database details and raw validation-library
payloads are not serialized as public API contract.

## Error Flow

```text
1. Domain/Application/Infrastructure throws an error
                    ↓
2. Error propagates to the HTTP adapter
                    ↓
3. presentation/http/error-handler.ts catches it
                    ↓
4. Handler maps the error code to HTTP status and sends the safe API response
```

The status mapping lives in the HTTP adapter. This keeps non-presentation layers
transport-independent and preserves the option to add other adapters later.

## Adding New Errors

### Domain or Application Error

Use a coded error when the failure is expected and should be represented to API
clients.

```typescript
export class VersionConflictError extends CodedApplicationError<"VERSION_CONFLICT"> {
  constructor(context: ErrorContextByCode["VERSION_CONFLICT"]) {
    super("Version conflict", apiErrorCodes.versionConflict, context);
  }
}
```

Then add or verify its HTTP status mapping in
`apps/backend/src/presentation/http/error-handler.ts`.

### Infrastructure Error

Use a coded infrastructure error only when the public response can safely expose
allowlisted context.

```typescript
export class RepositoryNotFoundError extends CodedInfrastructureError<"ENTITY_NOT_FOUND"> {
  constructor(
    message: string,
    context: ErrorContextByCode["ENTITY_NOT_FOUND"],
  ) {
    super(message, apiErrorCodes.entityNotFound, context);
  }
}
```

Use a non-coded `DatabaseError` for diagnostic persistence failures that should
always become a safe internal-server response.

### HTTP-Specific Error

Use `HttpApiError` only inside the HTTP adapter.

```typescript
export class UnauthorizedError extends HttpApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}
```

HTTP-specific errors live in `presentation/http/errors` and are exported through
`presentation/http/index.ts`.

## Clean Architecture Rules

Correct:

```typescript
import { UserNotFoundError } from "src/application/application.errors";

throw new UserNotFoundError();
```

Correct:

```typescript
import { RepositoryNotFoundError } from "src/infrastructure/errors";

throw new RepositoryNotFoundError("Account not found", {
  entityType: "account",
});
```

Wrong:

```typescript
import { UnauthorizedError } from "src/presentation/http";

throw new UnauthorizedError();
```

Application, domain and infrastructure code must not throw HTTP presentation
errors.

## Related

- [ADR 0008: Structured API error contract](./architecture/adr/0008-structured-api-error-contract.md)
- [ADR 0017: Backend HTTP adapter boundary](./architecture/adr/0017-backend-http-adapter-boundary.md)
- [ADR 0018: Backend HTTP error boundary](./architecture/adr/0018-backend-http-error-boundary.md)
