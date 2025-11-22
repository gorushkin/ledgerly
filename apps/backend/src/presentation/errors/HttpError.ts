import { BaseError } from 'src/shared/errors/BaseError';

/**
 * HTTP-specific error with status code for REST API responses.
 * Use this only in the presentation layer for errors that need to be translated to HTTP responses.
 */
export class HttpApiError extends BaseError {
  constructor(
    message: string,
    public readonly statusCode = 500,
    cause?: Error,
  ) {
    super(message, cause);
  }
}
