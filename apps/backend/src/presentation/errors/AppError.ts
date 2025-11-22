import { BaseError } from 'src/shared/errors/BaseError';

export type ErrorType =
  | 'AppError'
  | 'DatabaseError'
  | 'UnauthorizedError'
  | 'UserNotFoundError'
  | 'UserExistsError'
  | 'InvalidPasswordError'
  | 'EmailAlreadyExistsError';

/**
 * Presentation layer error with HTTP status code.
 * Use this for errors that need to be translated to HTTP responses.
 */
export class AppError extends BaseError {
  constructor(
    message: string,
    public statusCode = 500,
    public type: ErrorType = 'AppError',
    cause?: Error,
  ) {
    super(message, cause);
    this.statusCode = statusCode;
    this.type = type;
  }
}
