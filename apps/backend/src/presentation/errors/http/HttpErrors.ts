import { AppError } from '../AppError';

export type ErrorMeta = {
  entity?: string;
  entityId?: string;
  attemptedUserId?: string;
  ownerUserId?: string;
  [key: string]: unknown;
};

export class NotFoundError extends AppError {
  constructor(
    message = 'Not found',
    public meta?: ErrorMeta,
  ) {
    super(message, 404, undefined);
  }
}
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = 'Unauthorized',
    public meta?: ErrorMeta,
  ) {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'Forbidden',
    public meta?: ErrorMeta,
  ) {
    super(message, 403, undefined);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}
