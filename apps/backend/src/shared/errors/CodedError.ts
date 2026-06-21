import type { ApiErrorCode, ErrorContextByCode } from '@ledgerly/shared/types';

import { BaseError } from './BaseError';

/**
 * Base error for failures that have a stable, client-safe API representation.
 * HTTP status mapping belongs to the presentation layer.
 */
export abstract class CodedError<Code extends ApiErrorCode> extends BaseError {
  protected constructor(
    message: string,
    public readonly code: Code,
    public readonly context: ErrorContextByCode[Code],
    cause?: Error,
  ) {
    super(message, cause);
  }
}
