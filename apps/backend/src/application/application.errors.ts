import {
  apiErrorCodes,
  type ApiErrorCode,
  type ErrorContextByCode,
} from '@ledgerly/shared/types';
import { BaseError } from 'src/shared/errors';

/**
 * Base class for all application layer errors.
 * Application errors represent use case failures (e.g., entity not found, unauthorized access).
 */
export class ApplicationError extends BaseError {}

/**
 * Base application error with a stable, client-safe contract.
 */
export abstract class CodedApplicationError<
  Code extends ApiErrorCode,
> extends ApplicationError {
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
 * Thrown when an entity is not found in the system.
 */
export class EntityNotFoundError extends CodedApplicationError<'ENTITY_NOT_FOUND'> {
  constructor(context: ErrorContextByCode['ENTITY_NOT_FOUND']) {
    super(
      `${context.entityType} not found`,
      apiErrorCodes.entityNotFound,
      context,
    );
  }
}

/**
 * Thrown when a user attempts to access an entity they don't own.
 */
export class UnauthorizedAccessError extends CodedApplicationError<'UNAUTHORIZED_ACCESS'> {
  constructor(context: ErrorContextByCode['UNAUTHORIZED_ACCESS']) {
    super(
      `${context.entityType} does not belong to the user`,
      apiErrorCodes.unauthorizedAccess,
      context,
    );
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

/**
 * Thrown when an update cannot be applied because aggregate versions differ.
 */
export class VersionConflictError extends CodedApplicationError<'VERSION_CONFLICT'> {
  constructor(context: ErrorContextByCode['VERSION_CONFLICT']) {
    super(
      `${context.entityType} version mismatch for expected version ${context.expectedVersion}`,
      apiErrorCodes.versionConflict,
      context,
    );
  }
}
