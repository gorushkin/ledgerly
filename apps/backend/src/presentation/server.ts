import cors from '@fastify/cors';
import Fastify from 'fastify';
import { ZodError } from 'zod';

import { registerRoutes } from './routes';

export function createServer() {
  const fastify = Fastify();

  fastify.setErrorHandler((error, _request, reply) => {
    const status = error.statusCode ?? 500;

    if (error instanceof ZodError) {
      const firstIssue = error.errors[0];
      reply.status(400).send({
        error: true,
        message: firstIssue?.message || 'Validation failed',
        path: firstIssue?.path,
      });
      return;
    }

    reply.status(status).send({
      error: true,
      message: error.message || 'Unexpected error',
    });
  });

  fastify.register(cors, {
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    origin: 'http://localhost:3000',
  });

  fastify.register(registerRoutes, { prefix: '/api' });

  return fastify;
}
