import { HttpApiError } from './HttpError';

export class BusinessLogicError extends HttpApiError {
  constructor(message: string, statusCode = 400, cause?: Error) {
    super(message, statusCode, cause);
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
