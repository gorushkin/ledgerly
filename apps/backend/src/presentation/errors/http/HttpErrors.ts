import { HttpApiError } from '../HttpError';

export type ErrorMeta = {
  entity?: string;
  entityId?: string;
  attemptedUserId?: string;
  ownerUserId?: string;
  [key: string]: unknown;
};

export class BadRequestError extends HttpApiError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}
