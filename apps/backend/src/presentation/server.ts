import fastifyJwt from '@fastify/jwt';
import Fastify from 'fastify';
import { config } from 'src/config/config';
import { createContainer } from 'src/di/container';
import { errorHandler } from 'src/libs/errorHandler';

import { db as defaultDb } from '../db';

import { registerRoutes } from './routes';
export function createServer(db = defaultDb) {
  const fastify = Fastify({
    logger: false,
  });

  fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  if (config.env !== 'test') {
    fastify.addHook('onRequest', (request, _reply, done) => {
      console.info(`${request.method} ${request.url}`, request.body);
      done();
    });
  }

  fastify.setErrorHandler(errorHandler);

  fastify.decorate('container', createContainer(db));

  fastify.register(registerRoutes, { prefix: '/api' });

  return fastify;
}
