import type { FastifyRequest } from 'fastify';
import { Id, Timestamp } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';
import { RepositoryNotFoundError } from 'src/infrastructure/errors';
import { UnauthorizedError } from 'src/presentation/http';
import { describe, expect, it, vi } from 'vitest';

import { authMiddleware } from './auth.middleware';

const createRequest = ({
  authorization,
  getById = vi.fn(),
  jwtVerify = vi.fn(),
}: {
  authorization?: string;
  getById?: ReturnType<typeof vi.fn>;
  jwtVerify?: ReturnType<typeof vi.fn>;
}) =>
  ({
    headers: { authorization },
    jwtVerify,
    server: {
      container: {
        repositories: {
          user: { getById },
        },
      },
    },
  }) as unknown as FastifyRequest;

describe('authMiddleware', () => {
  const user = User.restore({
    createdAt: Timestamp.create().valueOf(),
    email: 'user@example.com',
    id: Id.create().valueOf(),
    name: 'Test User',
    password: 'hashed-password',
    updatedAt: Timestamp.create().valueOf(),
  });

  it('loads the authenticated domain user', async () => {
    const getById = vi.fn().mockResolvedValue(user.toSnapshot());
    const request = createRequest({
      authorization: 'Bearer token',
      getById,
      jwtVerify: vi.fn().mockResolvedValue({
        email: user.email.valueOf(),
        userId: user.getId().valueOf(),
      }),
    });

    await authMiddleware(request, {} as never);

    expect(getById).toHaveBeenCalledWith(user.getId().valueOf());
    expect(request.user.toSnapshot()).toEqual(user.toSnapshot());
  });

  it('preserves the authentication-required error when the token is missing', async () => {
    await expect(
      authMiddleware(createRequest({}), {} as never),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('preserves the user-not-found error when the token user no longer exists', async () => {
    const request = createRequest({
      authorization: 'Bearer token',
      getById: vi.fn().mockRejectedValue(
        new RepositoryNotFoundError('User with ID missing-user-id not found', {
          entityId: 'missing-user-id' as never,
          entityType: 'user',
        }),
      ),
      jwtVerify: vi.fn().mockResolvedValue({
        email: 'missing@example.com',
        userId: 'missing-user-id',
      }),
    });

    await expect(authMiddleware(request, {} as never)).rejects.toThrow(
      new UnauthorizedError('User not found'),
    );
  });

  it('preserves repository failures for the global error handler', async () => {
    const repositoryError = new Error('database unavailable');
    const request = createRequest({
      authorization: 'Bearer token',
      getById: vi.fn().mockRejectedValue(repositoryError),
      jwtVerify: vi.fn().mockResolvedValue({
        email: 'user@example.com',
        userId: user.getId().valueOf(),
      }),
    });

    await expect(authMiddleware(request, {} as never)).rejects.toBe(
      repositoryError,
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

  it.todo(
    'covers auth token variants centrally: invalid, expired, malformed, and unsupported Authorization scheme',
  );
});
