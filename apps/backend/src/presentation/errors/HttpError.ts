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
 * Presentation-layer base class for transport-specific API errors.
 *
 * Domain, application, and infrastructure code should expose stable coded
 * errors instead. Use concrete subclasses only at HTTP boundaries such as
 * middleware.
 */
export abstract class HttpApiError extends BaseError {
  protected constructor(
    message: string,
    public readonly statusCode: HttpApiStatusCode = 500,
    cause?: Error,
    public readonly code: ApiErrorCode = getHttpErrorCode(statusCode),
  ) {
    super(message, cause);
  }
}
