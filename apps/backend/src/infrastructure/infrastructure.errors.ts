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
