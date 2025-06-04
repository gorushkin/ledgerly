import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { DatabaseError } from '../infrastructure/db/errors';
import { AppError } from '../presentation/errors/AppError';

export function errorHandler(
  error: FastifyError | AppError | ZodError | DatabaseError,
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

  if (error instanceof AppError) {
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
