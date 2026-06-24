import { apiErrorCodes, type ApiErrorCode } from '@ledgerly/shared/types';
import { BaseError } from 'src/shared/errors/BaseError';

type HttpApiStatusCode = 400 | 401 | 409 | 500;

const errorCodeByStatus: Record<
  Exclude<HttpApiStatusCode, 500>,
  ApiErrorCode
> = {
  400: apiErrorCodes.badRequest,
  401: apiErrorCodes.unauthorized,
  409: apiErrorCodes.conflict,
};

const getHttpErrorCode = (statusCode: HttpApiStatusCode): ApiErrorCode =>
  statusCode === 500
    ? apiErrorCodes.internalServerError
    : errorCodeByStatus[statusCode];

/**
 * HTTP-specific error with status code for REST API responses.
 * Use this only in the presentation layer for errors that need to be translated to HTTP responses.
 */
export class HttpApiError extends BaseError {
  constructor(
    message: string,
    public readonly statusCode: HttpApiStatusCode = 500,
    cause?: Error,
    public readonly code: ApiErrorCode = getHttpErrorCode(statusCode),
  ) {
    super(message, cause);
  }
}
