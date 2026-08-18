import { apiErrorCodes, UUID } from '@ledgerly/shared/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { User } from 'src/domain/users';
import { isCodedError } from 'src/shared/errors';

import { UnauthorizedError } from '../errors';

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  let decoded: {
    userId: UUID;
    email: string;
  };

  try {
    decoded = await request.jwtVerify<{
      userId: UUID;
      email: string;
    }>();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  const userRepository = request.server.container.repositories.user;

  try {
    const userSnapshot = await userRepository.getById(decoded.userId);

    request.user = User.restore(userSnapshot);
  } catch (error) {
    if (isCodedError(error) && error.code === apiErrorCodes.entityNotFound) {
      throw new UnauthorizedError('User not found');
    }

    throw error;
  }
}
