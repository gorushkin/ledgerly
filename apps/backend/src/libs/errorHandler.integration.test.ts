import { apiErrorCodes, type ApiErrorResponse } from '@ledgerly/shared/types';
import Fastify, { type FastifyInstance } from 'fastify';
import {
  DatabaseError,
  ForeignKeyConstraintError,
  ForbiddenAccessError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';
import { HttpApiError } from 'src/presentation/errors';
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

  it.each([
    [401, apiErrorCodes.unauthorized],
    [409, apiErrorCodes.conflict],
  ] as const)('maps HttpApiError status %i to %s', async (statusCode, code) => {
    const server = createServer();
    server.get('/http-error', () => {
      throw new HttpApiError('request diagnostic', statusCode);
    });

    const response = await server.inject('/http-error');

    expect(response.statusCode).toBe(statusCode);
    expect(response.json<ApiErrorResponse>()).toEqual({
      code,
      context: {},
      error: true,
    });
  });

  it('serializes repository-not-found errors with an allowlisted context', async () => {
    const server = createServer();

    server.get('/repository-not-found', () => {
      throw new RepositoryNotFoundError('repository diagnostic', {
        entityType: 'account',
      });
    });

    const response = await server.inject('/repository-not-found');

    expect(response.statusCode).toBe(404);
    expect(response.json<ApiErrorResponse>()).toEqual({
      code: apiErrorCodes.entityNotFound,
      context: { entityType: 'account' },
      error: true,
    });

    expect(response.body).not.toContain('repository diagnostic');
  });

  it('serializes forbidden repository access with an allowlisted context', async () => {
    const server = createServer();

    server.get('/repository-forbidden', () => {
      throw new ForbiddenAccessError('repository diagnostic', {
        entityType: 'account',
      });
    });

    const response = await server.inject('/repository-forbidden');

    expect(response.statusCode).toBe(403);
    expect(response.json<ApiErrorResponse>()).toEqual({
      code: apiErrorCodes.unauthorizedAccess,
      context: { entityType: 'account' },
      error: true,
    });
    expect(response.body).not.toContain('repository diagnostic');
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

  it('does not expose normalized database constraint context over HTTP', async () => {
    const server = createServer();

    server.get('/database-constraint-error', () => {
      throw new ForeignKeyConstraintError({
        context: {
          field: 'account_id',
          tableName: 'operations',
          value: 'account-id',
        },
      });
    });

    const response = await server.inject('/database-constraint-error');

    expect(response.statusCode).toBe(500);
    expect(response.json<ApiErrorResponse>()).toEqual({
      code: apiErrorCodes.internalServerError,
      context: {},
      error: true,
    });

    expect(response.body).not.toContain('account_id');
    expect(response.body).not.toContain('operations');
    expect(response.body).not.toContain('account-id');
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
