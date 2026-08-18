import { UUID } from '@ledgerly/shared/types';
import { FastifyReply, FastifyRequest } from 'fastify';

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

  const user = await userRepository.getByIdWithPassword(decoded.userId);

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  request.user = user;
}
