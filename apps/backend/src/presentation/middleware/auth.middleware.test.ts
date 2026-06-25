import type { FastifyRequest } from 'fastify';
import { UnauthorizedError } from 'src/presentation/errors';
import { describe, expect, it, vi } from 'vitest';

import { authMiddleware } from './auth.middleware';

const createRequest = ({
  authorization,
  getByIdWithPassword = vi.fn(),
  jwtVerify = vi.fn(),
}: {
  authorization?: string;
  getByIdWithPassword?: ReturnType<typeof vi.fn>;
  jwtVerify?: ReturnType<typeof vi.fn>;
}) =>
  ({
    headers: { authorization },
    jwtVerify,
    server: {
      container: {
        repositories: {
          user: { getByIdWithPassword },
        },
      },
    },
  }) as unknown as FastifyRequest;

describe('authMiddleware', () => {
  it('preserves the authentication-required error when the token is missing', async () => {
    await expect(
      authMiddleware(createRequest({}), {} as never),
    ).rejects.toThrow(new UnauthorizedError('Authentication required'));
  });

  it('preserves the user-not-found error when the token user no longer exists', async () => {
    const request = createRequest({
      authorization: 'Bearer token',
      getByIdWithPassword: vi.fn().mockResolvedValue(null),
      jwtVerify: vi.fn().mockResolvedValue({
        email: 'missing@example.com',
        userId: 'missing-user-id',
      }),
    });

    await expect(authMiddleware(request, {} as never)).rejects.toThrow(
      new UnauthorizedError('User not found'),
    );
  });

  it('normalizes token verification failures to the invalid-token error', async () => {
    const request = createRequest({
      authorization: 'Bearer invalid-token',
      jwtVerify: vi.fn().mockRejectedValue(new Error('jwt expired')),
    });

    await expect(authMiddleware(request, {} as never)).rejects.toThrow(
      new UnauthorizedError('Invalid or expired token'),
    );
  });
});
