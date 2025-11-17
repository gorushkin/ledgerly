export type ErrorType =
  | 'AppError'
  | 'BusinessLogicError'
  | 'NotFoundError'
  | 'UnbalancedTransactionError'
  | 'ForbiddenError'
  | 'AlreadyExistsError'
  | 'ConflictError'
  | 'ValidationError'
  | 'CustomErrorName'
  | 'DatabaseError'
  | 'UnauthorizedError'
  | 'UserNotFoundError'
  | 'UserExistsError'
  | 'InvalidPasswordError'
  | 'EmailAlreadyExistsError'
  | 'UnbalancedOperationsError';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public type: ErrorType = 'AppError',
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
