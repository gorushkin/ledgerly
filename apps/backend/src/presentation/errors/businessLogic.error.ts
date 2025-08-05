import { AppError, ErrorType } from './AppError';

export class BusinessLogicError extends AppError {
  constructor(
    message: string,
    statusCode = 400,
    type: ErrorType = 'BusinessLogicError',
    cause?: Error,
  ) {
    super(message, statusCode, type, cause);
  }
}

export class UnbalancedTransactionError extends BusinessLogicError {
  constructor(diff: number) {
    super(
      `Сумма операций не сбалансирована. Разница: ${diff}`,
      400,
      'UnbalancedTransactionError',
    );
  }
}

export class NotFoundError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 404, 'NotFoundError');
  }
}

export class ForbiddenError extends BusinessLogicError {
  constructor(message = 'Access denied') {
    super(message, 403, 'ForbiddenError');
  }
}

export class AlreadyExistsError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 409, 'AlreadyExistsError');
  }
}

export class ConflictError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 409, 'ConflictError');
  }
}

export class ValidationError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 400, 'ValidationError');
  }
}

export class CustomErrorName extends BusinessLogicError {
  constructor(message: string) {
    super(message, 400, 'CustomErrorName');
  }
}
