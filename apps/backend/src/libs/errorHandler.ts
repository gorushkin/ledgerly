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
import { CodedError } from 'src/shared/errors';
import { ZodError, type ZodIssue } from 'zod';

const statusByErrorCode = {
  [apiErrorCodes.entityNotFound]: 404,
  [apiErrorCodes.invalidAmount]: 400,
  [apiErrorCodes.transactionUnbalanced]: 400,
  [apiErrorCodes.unauthorizedAccess]: 403,
  [apiErrorCodes.validationFailed]: 400,
  [apiErrorCodes.versionConflict]: 409,
} satisfies Record<ApiErrorCode, number>;

const getValidationFieldErrorCode = (
  issue: ZodIssue,
): ValidationFieldErrorCode => {
  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
    return 'REQUIRED';
  }

  switch (issue.code) {
    case 'invalid_string':
      return 'INVALID_FORMAT';
    case 'invalid_type':
      return 'INVALID_TYPE';
    case 'too_big':
      return 'TOO_BIG';
    case 'too_small':
      return 'TOO_SMALL';
    default:
      return 'INVALID_VALUE';
  }
};

export function errorHandler(
  error:
    | FastifyError
    | HttpApiError
    | ZodError
    | DatabaseError
    | DomainError
    | CodedError<ApiErrorCode>
    | RepositoryNotFoundError
    | UserNotFoundError
    | InvalidPasswordError
    | UserAlreadyExistsError,
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

  if (error instanceof CodedError) {
    return reply.status(statusByErrorCode[error.code]).send({
      code: error.code,
      context: error.context,
      error: true,
    });
  }

  // Domain layer errors - business rule violations
  if (error instanceof DomainError) {
    return reply.status(400).send({
      error: true,
      message: error.message,
    });
  }

  // Application layer errors - authentication/authorization
  if (error instanceof UserNotFoundError) {
    return reply.status(401).send({
      error: true,
      message: error.message,
    });
  }

  if (error instanceof InvalidPasswordError) {
    return reply.status(401).send({
      error: true,
      message: error.message,
    });
  }

  if (error instanceof UserAlreadyExistsError) {
    return reply.status(409).send({
      error: true,
      message: error.message,
    });
  }

  // Infrastructure layer errors
  if (error instanceof RepositoryNotFoundError) {
    return reply.status(404).send({
      error: true,
      message: error.message,
    });
  }

  if (error instanceof HttpApiError) {
    return reply.status(error.statusCode).send({
      error: true,
      message: error.message,
    });
  }

  if (error instanceof DatabaseError) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Database error:', error);
    }
    return reply.status(500).send({
      error: true,
      message: 'Database operation failed',
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('Unexpected error:', error);
  }

  return reply.status(500).send({
    error: true,
    message: 'Internal server error',
  });
}
