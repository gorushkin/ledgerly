import { AppError } from '../AppError';

export type ErrorMeta = {
  entity?: string;
  entityId?: string;
  attemptedUserId?: string;
  ownerUserId?: string;
  [key: string]: unknown;
};

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

// TODO: move this to a more appropriate place
