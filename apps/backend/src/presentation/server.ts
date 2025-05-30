import { LibSQLDatabase } from 'drizzle-orm/libsql';
import Fastify from 'fastify';
import { ZodError } from 'zod';

import { db as defaultDb } from '../db';
import * as schema from '../db/schemas';

import { registerRoutes } from './routes';

declare module 'fastify' {
  interface FastifyInstance {
    db: LibSQLDatabase<typeof schema>;
  }
}

export function createServer(db: LibSQLDatabase<typeof schema> = defaultDb) {
  const fastify = Fastify({
    logger: false,
  });

  fastify.addHook('onRequest', (request, _reply, done) => {
    console.info(`${request.method} ${request.url}`, request.body);
    done();
  });

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

  fastify.decorate('db', db);

  fastify.register(registerRoutes, { prefix: '/api' });

  return fastify;
}
