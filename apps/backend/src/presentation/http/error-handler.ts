import {
  apiErrorCodes,
  type ApiErrorCode,
  type ErrorContextByCode,
  type ValidationFieldErrorCode,
} from '@ledgerly/shared/types';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  DatabaseError,
  RecordAlreadyExistsError,
} from 'src/infrastructure/errors';
import { isCodedError } from 'src/shared/errors';
import { reportDatabaseError } from 'src/shared/errors/reportDatabaseError';
import { ZodError, type ZodIssue } from 'zod';

import { HttpApiError } from './errors';

const statusByErrorCode = {
  [apiErrorCodes.accountHasActiveOperations]: 409,
  [apiErrorCodes.accountNotFoundInContext]: 400,
  [apiErrorCodes.authenticationFailed]: 401,
  [apiErrorCodes.badRequest]: 400,
  [apiErrorCodes.closedAccountOperation]: 409,
  [apiErrorCodes.closedCommodityReference]: 409,
  [apiErrorCodes.commodityHasActiveReferences]: 409,
  [apiErrorCodes.conflict]: 409,
  [apiErrorCodes.conflictingOperationIds]: 400,
  [apiErrorCodes.deletedEntityOperation]: 400,
  [apiErrorCodes.emptyOperations]: 400,
  [apiErrorCodes.entityNotFound]: 404,
  [apiErrorCodes.excessiveOperations]: 400,
  [apiErrorCodes.insufficientOperations]: 400,
  [apiErrorCodes.internalServerError]: 500,
  [apiErrorCodes.invalidAccountType]: 400,
  [apiErrorCodes.invalidAmount]: 400,
  [apiErrorCodes.invalidCommodityCode]: 400,
  [apiErrorCodes.invalidCommodityPrecision]: 400,
  [apiErrorCodes.invalidCommoditySymbol]: 400,
  [apiErrorCodes.invalidDate]: 400,
  [apiErrorCodes.invalidEmail]: 400,
  [apiErrorCodes.invalidIdentifier]: 400,
  [apiErrorCodes.invalidName]: 400,
  [apiErrorCodes.invalidPassword]: 400,
  [apiErrorCodes.invalidTimestamp]: 400,
  [apiErrorCodes.invalidVersion]: 400,
  [apiErrorCodes.operationAlreadyAttachedToTransaction]: 400,
  [apiErrorCodes.operationIdMismatch]: 400,
  [apiErrorCodes.operationNotFoundInTransaction]: 400,
  [apiErrorCodes.operationTransactionMismatch]: 400,
  [apiErrorCodes.operationUserMismatch]: 400,
  [apiErrorCodes.registrationConflict]: 409,
  [apiErrorCodes.transactionUnbalanced]: 400,
  [apiErrorCodes.unauthorized]: 401,
  [apiErrorCodes.unauthorizedAccess]: 403,
  [apiErrorCodes.validationFailed]: 400,
  [apiErrorCodes.versionConflict]: 409,
} satisfies Record<ApiErrorCode, number>;

const validationFieldCodeByZodIssueCode: Partial<
  Record<ZodIssue['code'], ValidationFieldErrorCode>
> = {
  invalid_string: 'INVALID_FORMAT',
  invalid_type: 'INVALID_TYPE',
  too_big: 'TOO_BIG',
  too_small: 'TOO_SMALL',
};

export const getValidationFieldErrorCode = (
  issue: ZodIssue,
): ValidationFieldErrorCode => {
  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
    return 'REQUIRED';
  }

  return validationFieldCodeByZodIssueCode[issue.code] ?? 'INVALID_VALUE';
};

const sendCodedError = <Code extends ApiErrorCode>(
  reply: FastifyReply,
  status: number,
  code: Code,
  context: ErrorContextByCode[Code],
) =>
  reply.status(status).send({
    code,
    context,
    error: true,
  });

type InvalidJsonError = SyntaxError & {
  statusCode: 400;
};

const isInvalidJsonError = (error: unknown): error is InvalidJsonError => {
  return (
    error instanceof SyntaxError &&
    'statusCode' in error &&
    error.statusCode === 400
  );
};

const isFastifyError = (error: unknown): error is FastifyError => {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('FST_')
  );
};

type FastifyErrorWithStatus = FastifyError & {
  status?: number;
};

const getFastifyErrorStatus = (error: FastifyError): number => {
  const status = error.statusCode ?? (error as FastifyErrorWithStatus).status;

  return typeof status === 'number' && status >= 400 && status < 600
    ? status
    : statusByErrorCode[apiErrorCodes.internalServerError];
};

type CodedErrorPayload = {
  [Code in ApiErrorCode]: {
    code: Code;
    context: ErrorContextByCode[Code];
    error: true;
  };
}[ApiErrorCode];

const fastifyErrorPayloadByStatus: Partial<Record<number, CodedErrorPayload>> =
  {
    401: {
      code: apiErrorCodes.unauthorized,
      context: {},
      error: true,
    },
    403: {
      code: apiErrorCodes.unauthorizedAccess,
      context: { entityType: 'request' },
      error: true,
    },
    404: {
      code: apiErrorCodes.entityNotFound,
      context: { entityType: 'route' },
      error: true,
    },
    409: {
      code: apiErrorCodes.conflict,
      context: {},
      error: true,
    },
  } satisfies Partial<Record<number, CodedErrorPayload>>;

const getFastifyErrorPayload = (status: number): CodedErrorPayload => {
  if (status >= 500) {
    return {
      code: apiErrorCodes.internalServerError,
      context: {},
      error: true,
    };
  }

  return (
    fastifyErrorPayloadByStatus[status] ?? {
      code: apiErrorCodes.badRequest,
      context: {},
      error: true,
    }
  );
};

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  if (isInvalidJsonError(error)) {
    return sendCodedError(
      reply,
      statusByErrorCode[apiErrorCodes.badRequest],
      apiErrorCodes.badRequest,
      {},
    );
  }

  if (isFastifyError(error)) {
    const status = getFastifyErrorStatus(error);

    return reply.status(status).send(getFastifyErrorPayload(status));
  }

  if (error instanceof ZodError) {
    const fields = error.issues.map((issue) => ({
      code: getValidationFieldErrorCode(issue),
      path: issue.path.length > 0 ? issue.path.join('.') : '$',
    }));

    return sendCodedError(
      reply,
      statusByErrorCode[apiErrorCodes.validationFailed],
      apiErrorCodes.validationFailed,
      { fields },
    );
  }

  if (isCodedError(error)) {
    return sendCodedError(
      reply,
      statusByErrorCode[error.code],
      error.code,
      error.context,
    );
  }

  if (error instanceof RecordAlreadyExistsError) {
    return sendCodedError(
      reply,
      statusByErrorCode[apiErrorCodes.conflict],
      apiErrorCodes.conflict,
      {},
    );
  }

  if (error instanceof DatabaseError) {
    reportDatabaseError(error);
    return sendCodedError(
      reply,
      statusByErrorCode[apiErrorCodes.internalServerError],
      apiErrorCodes.internalServerError,
      {},
    );
  }

  if (error instanceof HttpApiError) {
    return sendCodedError(reply, error.statusCode, error.code, {});
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('Unexpected error:', error);
  }

  return sendCodedError(
    reply,
    statusByErrorCode[apiErrorCodes.internalServerError],
    apiErrorCodes.internalServerError,
    {},
  );
}
