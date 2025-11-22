import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import {
  EntityNotFoundError,
  InvalidPasswordError,
  UnauthorizedAccessError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from 'src/application/application.errors';
import { ZodError } from 'zod';

import { RepositoryNotFoundError } from '../infrastructure/infrastructure.errors';
import { DatabaseError, HttpApiError } from '../presentation/errors';

export function errorHandler(
  error:
    | FastifyError
    | HttpApiError
    | ZodError
    | DatabaseError
    | EntityNotFoundError
    | UnauthorizedAccessError
    | RepositoryNotFoundError
    | UserNotFoundError
    | InvalidPasswordError
    | UserAlreadyExistsError,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ZodError) {
    const formatted = error.issues.map((issue) => ({
      code: issue.code,
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return reply.status(400).send({
      error: true,
      errors: formatted,
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

  // Application layer errors - entity operations
  if (error instanceof EntityNotFoundError) {
    return reply.status(404).send({
      error: true,
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedAccessError) {
    return reply.status(403).send({
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
    console.error('Database error:', error);
    return reply.status(500).send({
      error: true,
      message: 'Database operation failed',
    });
  }

  console.error('Unexpected error:', error);
  return reply.status(500).send({
    error: true,
    message: 'Internal server error',
  });
}
