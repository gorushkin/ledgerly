import { apiErrorCodes, type ApiErrorResponse } from '@ledgerly/shared/types';
import Fastify, { type FastifyInstance } from 'fastify';
import { DatabaseError, HttpApiError } from 'src/presentation/errors';
import { afterEach, describe, expect, it } from 'vitest';

import { errorHandler } from './errorHandler';

describe('errorHandler HTTP integration', () => {
  const servers: FastifyInstance[] = [];

  const createServer = () => {
    const server = Fastify();
    server.setErrorHandler(errorHandler);
    servers.push(server);

    return server;
  };

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
  });

  it('serializes HttpApiError as a safe API response', async () => {
    const server = createServer();
    server.get('/http-error', () => {
      throw new HttpApiError('request diagnostic', 400);
    });

    const response = await server.inject('/http-error');

    expect(response.statusCode).toBe(400);
    expect(response.json<ApiErrorResponse>()).toEqual({
      code: apiErrorCodes.badRequest,
      context: {},
      error: true,
    });
  });

  it('does not expose database diagnostics over HTTP', async () => {
    const server = createServer();
    server.get('/database-error', () => {
      throw new DatabaseError({ message: 'database password is secret' });
    });

    const response = await server.inject('/database-error');

    expect(response.statusCode).toBe(500);
    expect(response.json<ApiErrorResponse>()).toEqual({
      code: apiErrorCodes.internalServerError,
      context: {},
      error: true,
    });
  });

  it('serializes unknown errors as safe internal-server responses', async () => {
    const server = createServer();
    server.get('/unknown-error', () => {
      throw new Error('unhandled secret diagnostic');
    });

    const response = await server.inject('/unknown-error');

    expect(response.statusCode).toBe(500);
    expect(response.json<ApiErrorResponse>()).toEqual({
      code: apiErrorCodes.internalServerError,
      context: {},
      error: true,
    });
  });
});
