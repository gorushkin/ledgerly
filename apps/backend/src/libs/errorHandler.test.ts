import {
  apiErrorCodes,
  type ValidationFieldErrorCode,
} from '@ledgerly/shared/types';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  InvalidPasswordError,
  UserAlreadyExistsError,
  UserNotFoundError,
} from 'src/application/application.errors';
import {
  DatabaseError,
  DatabaseOperationError,
  ForbiddenAccessError,
  RepositoryInvariantError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';
import { HttpApiError, UnauthorizedError } from 'src/presentation/errors';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { errorHandler, getValidationFieldErrorCode } from './errorHandler';

const createReply = () => {
  let payload: unknown;
  let statusCode: number | undefined;
  const reply = {
    send: (body: unknown) => {
      payload = body;
      return reply;
    },
    status: (status: number) => {
      statusCode = status;
      return reply;
    },
  };

  return {
    reply: reply as unknown as FastifyReply,
    response: () => ({ payload, statusCode }),
  };
};

describe('getValidationFieldErrorCode', () => {
  const expectValidationCode = (
    result: ReturnType<z.ZodTypeAny['safeParse']>,
    expectedCode: ValidationFieldErrorCode,
  ) => {
    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    expect(getValidationFieldErrorCode(result.error.issues[0])).toBe(
      expectedCode,
    );
  };

  it('maps a missing required value to REQUIRED', () => {
    expectValidationCode(z.string().safeParse(undefined), 'REQUIRED');
  });

  it('maps an invalid type to INVALID_TYPE', () => {
    expectValidationCode(z.string().safeParse(42), 'INVALID_TYPE');
  });

  it('maps an invalid string format to INVALID_FORMAT', () => {
    expectValidationCode(
      z.string().email().safeParse('invalid'),
      'INVALID_FORMAT',
    );
  });

  it('maps a small value to TOO_SMALL', () => {
    expectValidationCode(z.string().min(2).safeParse('x'), 'TOO_SMALL');
  });

  it('maps a large value to TOO_BIG', () => {
    expectValidationCode(z.string().max(1).safeParse('xx'), 'TOO_BIG');
  });

  it('maps unrecognized Zod issues to INVALID_VALUE', () => {
    expectValidationCode(
      z.literal('expected').safeParse('received'),
      'INVALID_VALUE',
    );
  });
});

describe('errorHandler', () => {
  const handle = (error: Error) => {
    const { reply, response } = createReply();

    errorHandler(error, {} as FastifyRequest, reply);

    return response();
  };

  it('serializes concrete HTTP API errors with their stable code and no diagnostic message', () => {
    const response = handle(new UnauthorizedError('request diagnostic'));

    expect(response).toEqual({
      payload: {
        code: apiErrorCodes.unauthorized,
        context: {},
        error: true,
      },
      statusCode: 401,
    });
  });

  it.each([
    [
      'a missing user',
      new UserNotFoundError(),
      401,
      apiErrorCodes.authenticationFailed,
    ],
    [
      'an invalid password',
      new InvalidPasswordError(),
      401,
      apiErrorCodes.authenticationFailed,
    ],
    [
      'a duplicate registration',
      new UserAlreadyExistsError(),
      409,
      apiErrorCodes.registrationConflict,
    ],
  ])(
    'serializes %s through the generic coded-error path',
    (_caseName, error, expectedStatus, expectedCode) => {
      expect(handle(error)).toEqual({
        payload: {
          code: expectedCode,
          context: {},
          error: true,
        },
        statusCode: expectedStatus,
      });
    },
  );

  it('does not expose database diagnostics', () => {
    const response = handle(
      new DatabaseOperationError({ message: 'database password is secret' }),
    );

    expect(response).toEqual({
      payload: {
        code: apiErrorCodes.internalServerError,
        context: {},
        error: true,
      },
      statusCode: 500,
    });
  });

  it('keeps database errors out of the HTTP error hierarchy and logs them', () => {
    const cause = new Error('connection reset');

    const error = new DatabaseOperationError({
      cause,
      context: { tableName: 'users' },
      message: 'database password is secret',
    });

    const logError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.stubEnv('NODE_ENV', 'production');

    try {
      expect(error).not.toBeInstanceOf(HttpApiError);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.cause).toBe(cause);
      expect(error.context).toEqual({ tableName: 'users' });

      expect(handle(error)).toEqual({
        payload: {
          code: apiErrorCodes.internalServerError,
          context: {},
          error: true,
        },
        statusCode: 500,
      });

      expect(logError).toHaveBeenCalledWith('Database error:', error);
    } finally {
      logError.mockRestore();
      vi.unstubAllEnvs();
    }
  });

  it('serializes expected repository failures through the coded-error path', () => {
    expect(
      handle(
        new RepositoryNotFoundError('repository diagnostic', {
          entityType: 'account',
        }),
      ),
    ).toEqual({
      payload: {
        code: apiErrorCodes.entityNotFound,
        context: { entityType: 'account' },
        error: true,
      },
      statusCode: 404,
    });

    expect(
      handle(
        new ForbiddenAccessError('repository diagnostic', {
          entityType: 'account',
        }),
      ),
    ).toEqual({
      payload: {
        code: apiErrorCodes.unauthorizedAccess,
        context: { entityType: 'account' },
        error: true,
      },
      statusCode: 403,
    });
  });

  it('maps repository invariants to the safe internal-server response', () => {
    const response = handle(
      new RepositoryInvariantError('persistence snapshot diagnostic'),
    );

    expect(response).toEqual({
      payload: {
        code: apiErrorCodes.internalServerError,
        context: {},
        error: true,
      },
      statusCode: 500,
    });
  });

  it('uses a safe, stable response for unknown errors', () => {
    const response = handle(new Error('unhandled secret diagnostic'));

    expect(response).toEqual({
      payload: {
        code: apiErrorCodes.internalServerError,
        context: {},
        error: true,
      },
      statusCode: 500,
    });
  });
});
