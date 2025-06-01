import Fastify from 'fastify';
import { createContainer } from 'src/di/container';
import { AppContainer } from 'src/di/types';
import { DataBase } from 'src/types';
import { ZodError } from 'zod';

import { db as defaultDb } from '../db';

import { registerRoutes } from './routes';

declare module 'fastify' {
  interface FastifyInstance {
    container: AppContainer;
  }
}

export function createServer(db: DataBase = defaultDb) {
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

  const container = createContainer(db);

  fastify.decorate('container', container);

  fastify.register(registerRoutes, { prefix: '/api' });

  return fastify;
}
