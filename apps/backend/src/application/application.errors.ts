import { BaseError } from 'src/shared/errors/BaseError';

/**
 * Base class for all application layer errors.
 * Application errors represent use case failures (e.g., entity not found, unauthorized access).
 */
export class ApplicationError extends BaseError {}

/**
 * Thrown when an entity is not found in the system.
 */
export class EntityNotFoundError extends ApplicationError {
  constructor(entityName: string) {
    super(`${entityName} not found`);
  }
}

/**
 * Thrown when a user attempts to access an entity they don't own.
 */
export class UnauthorizedAccessError extends ApplicationError {
  constructor(entityName: string) {
    super(`${entityName} does not belong to the user`);
  }
}
