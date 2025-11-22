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

/**
 * Thrown when a user is not found during authentication.
 */
export class UserNotFoundError extends ApplicationError {
  constructor(message = 'User not found') {
    super(message);
  }
}

/**
 * Thrown when a password is invalid during authentication.
 */
export class InvalidPasswordError extends ApplicationError {
  constructor(message = 'Invalid password') {
    super(message);
  }
}

/**
 * Thrown when trying to register a user that already exists.
 */
export class UserAlreadyExistsError extends ApplicationError {
  constructor(message = 'User already exists') {
    super(message);
  }
}
