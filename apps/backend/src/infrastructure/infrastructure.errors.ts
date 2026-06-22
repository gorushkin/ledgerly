import type { ApiErrorCode, ErrorContextByCode } from '@ledgerly/shared/types';
import { BaseError } from 'src/shared/errors/BaseError';

/**
 * Base class for all infrastructure layer errors.
 * Infrastructure errors represent failures in external systems (databases, APIs, file systems, etc.).
 */
export class InfrastructureError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Base infrastructure error with a stable, client-safe contract.
 */
export abstract class CodedInfrastructureError<
  Code extends ApiErrorCode,
> extends InfrastructureError {
  protected constructor(
    message: string,
    public readonly code: Code,
    public readonly context: ErrorContextByCode[Code],
    cause?: Error,
  ) {
    super(message, cause);
  }
}

/**
 * Thrown when a repository operation fails to find a requested entity.
 */
export class RepositoryNotFoundError extends InfrastructureError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when a repository operation fails due to access/authorization issues.
 * Typically when a user tries to access a resource they don't own.
 */
export class ForbiddenAccessError extends InfrastructureError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when repository input violates expected persistence invariants.
 */
export class RepositoryInvariantError extends InfrastructureError {
  constructor(message: string) {
    super(message);
  }
}
