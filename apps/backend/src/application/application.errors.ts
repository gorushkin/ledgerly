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
export abstract class ApplicationError extends BaseError {}

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
 * A deliberately non-specific authentication failure.
 *
 * The diagnostic message may distinguish internal causes, but the public
 * response always uses AUTHENTICATION_FAILED with an empty context.
 */
export abstract class AuthenticationFailedError extends CodedApplicationError<'AUTHENTICATION_FAILED'> {
  protected constructor(message: string) {
    super(message, apiErrorCodes.authenticationFailed, {});
  }
}

/**
 * Retained to preserve an internal diagnostic for a missing user. Its public
 * contract is intentionally identical to an invalid password.
 */
export class UserNotFoundError extends AuthenticationFailedError {
  constructor(message = 'User not found') {
    super(message);
  }
}

/**
 * Retained to preserve an internal diagnostic for an invalid password. Its
 * public contract is intentionally identical to a missing user.
 */
export class InvalidPasswordError extends AuthenticationFailedError {
  constructor(message = 'Invalid password') {
    super(message);
  }
}

/**
 * Thrown when trying to register a user that already exists.
 */
export class UserAlreadyExistsError extends CodedApplicationError<'REGISTRATION_CONFLICT'> {
  constructor(message = 'User already exists') {
    super(message, apiErrorCodes.registrationConflict, {});
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
