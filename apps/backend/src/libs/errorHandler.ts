import {
  apiErrorCodes,
  type ApiErrorCode,
  type ValidationFieldErrorCode,
} from '@ledgerly/shared/types';
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  InvalidPasswordError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from 'src/application/application.errors';
import { DomainError } from 'src/domain/domain.errors';
import { RepositoryNotFoundError } from 'src/infrastructure/infrastructure.errors';
import { DatabaseError, HttpApiError } from 'src/presentation/errors/index';
import { isCodedError } from 'src/shared/errors';
import { ZodError, type ZodIssue } from 'zod';

const statusByErrorCode = {
  [apiErrorCodes.accountNotFoundInContext]: 400,
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

    return reply
      .status(statusByErrorCode[apiErrorCodes.validationFailed])
      .send({
        code: apiErrorCodes.validationFailed,
        context: { fields },
        error: true,
      });
  }

  if (isCodedError(error)) {
    return reply.status(statusByErrorCode[error.code]).send({
      code: error.code,
      context: error.context,
      error: true,
    });
  }

  // Legacy errors that have not yet been migrated to coded domain contracts.
  if (error instanceof DomainError) {
    return reply.status(statusByErrorCode[apiErrorCodes.badRequest]).send({
      code: apiErrorCodes.badRequest,
      context: {},
      error: true,
    });
  }

  // Application layer errors - authentication/authorization
  if (error instanceof UserNotFoundError) {
    return reply.status(statusByErrorCode[apiErrorCodes.unauthorized]).send({
      code: apiErrorCodes.unauthorized,
      context: {},
      error: true,
    });
  }

  if (error instanceof InvalidPasswordError) {
    return reply.status(statusByErrorCode[apiErrorCodes.unauthorized]).send({
      code: apiErrorCodes.unauthorized,
      context: {},
      error: true,
    });
  }

  if (error instanceof UserAlreadyExistsError) {
    return reply.status(statusByErrorCode[apiErrorCodes.conflict]).send({
      code: apiErrorCodes.conflict,
      context: {},
      error: true,
    });
  }

  // Infrastructure layer errors
  if (error instanceof RepositoryNotFoundError) {
    return reply.status(statusByErrorCode[apiErrorCodes.notFound]).send({
      code: apiErrorCodes.notFound,
      context: {},
      error: true,
    });
  }

  if (error instanceof DatabaseError) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Database error:', error);
    }
    return reply
      .status(statusByErrorCode[apiErrorCodes.internalServerError])
      .send({
        code: apiErrorCodes.internalServerError,
        context: {},
        error: true,
      });
  }

  if (error instanceof HttpApiError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      context: {},
      error: true,
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('Unexpected error:', error);
  }

  return reply
    .status(statusByErrorCode[apiErrorCodes.internalServerError])
    .send({
      code: apiErrorCodes.internalServerError,
      context: {},
      error: true,
    });
}
