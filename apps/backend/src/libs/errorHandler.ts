import {
  apiErrorCodes,
  type ApiErrorCode,
  type ErrorContextByCode,
  type ValidationFieldErrorCode,
} from '@ledgerly/shared/types';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from 'src/domain/domain.errors';
import { DatabaseError, HttpApiError } from 'src/presentation/errors/index';
import { isCodedError } from 'src/shared/errors';
import { ZodError, type ZodIssue } from 'zod';

const statusByErrorCode = {
  [apiErrorCodes.accountNotFoundInContext]: 400,
  [apiErrorCodes.authenticationFailed]: 401,
  [apiErrorCodes.badRequest]: 400,
  [apiErrorCodes.conflict]: 409,
  [apiErrorCodes.conflictingOperationIds]: 400,
  [apiErrorCodes.currencyMismatch]: 400,
  [apiErrorCodes.deletedEntityOperation]: 400,
  [apiErrorCodes.emptyOperations]: 400,
  [apiErrorCodes.entityNotFound]: 404,
  [apiErrorCodes.excessiveOperations]: 400,
  [apiErrorCodes.insufficientOperations]: 400,
  [apiErrorCodes.internalServerError]: 500,
  [apiErrorCodes.invalidAccountType]: 400,
  [apiErrorCodes.invalidAmount]: 400,
  [apiErrorCodes.invalidDate]: 400,
  [apiErrorCodes.invalidEmail]: 400,
  [apiErrorCodes.invalidIdentifier]: 400,
  [apiErrorCodes.invalidMoneyAmount]: 400,
  [apiErrorCodes.invalidName]: 400,
  [apiErrorCodes.invalidPassword]: 400,
  [apiErrorCodes.invalidTimestamp]: 400,
  [apiErrorCodes.invalidVersion]: 400,
  [apiErrorCodes.notFound]: 404,
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

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
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

  // Legacy errors that have not yet been migrated to coded domain contracts.
  if (error instanceof DomainError) {
    return sendCodedError(
      reply,
      statusByErrorCode[apiErrorCodes.badRequest],
      apiErrorCodes.badRequest,
      {},
    );
  }

  if (error instanceof DatabaseError) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Database error:', error);
    }
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
