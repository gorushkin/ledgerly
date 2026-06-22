import { apiErrorCodes, type ApiErrorCode } from '@ledgerly/shared/types';
import { BaseError } from 'src/shared/errors/BaseError';

const errorCodeByStatus: Record<number, ApiErrorCode> = {
  400: apiErrorCodes.badRequest,
  401: apiErrorCodes.unauthorized,
  404: apiErrorCodes.notFound,
  409: apiErrorCodes.conflict,
};

const getHttpErrorCode = (statusCode: number): ApiErrorCode =>
  errorCodeByStatus[statusCode] ?? apiErrorCodes.internalServerError;

/**
 * HTTP-specific error with status code for REST API responses.
 * Use this only in the presentation layer for errors that need to be translated to HTTP responses.
 */
export class HttpApiError extends BaseError {
  constructor(
    message: string,
    public readonly statusCode = 500,
    cause?: Error,
    public readonly code: ApiErrorCode = getHttpErrorCode(statusCode),
  ) {
    super(message, cause);
  }
}
