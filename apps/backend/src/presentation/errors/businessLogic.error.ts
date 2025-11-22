import { HttpApiError } from './HttpError';

export class BusinessLogicError extends HttpApiError {
  constructor(message: string, statusCode = 400, cause?: Error) {
    super(message, statusCode, cause);
  }
}

export class UnbalancedTransactionError extends BusinessLogicError {
  constructor(diff: number) {
    super(`Transaction operations are not balanced. Difference: ${diff}`, 400);
  }
}

export class NotFoundError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ForbiddenError extends BusinessLogicError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

export class AlreadyExistsError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ConflictError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationError extends BusinessLogicError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class CustomErrorName extends BusinessLogicError {
  constructor(message: string) {
    super(message, 400);
  }
}
