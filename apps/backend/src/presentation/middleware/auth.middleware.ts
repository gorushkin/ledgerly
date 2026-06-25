import { UUID } from '@ledgerly/shared/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { User } from 'src/domain/users/user.entity';

import { UnauthorizedError } from '../errors/auth.errors';

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const decoded = await request.jwtVerify<{
      userId: UUID;
      email: string;
    }>();

    const userRepository = request.server.container.repositories.user;

    const rawUser = await userRepository.getByIdWithPassword(decoded.userId);

    if (!rawUser) {
      throw new UnauthorizedError('User not found');
    }

    const user = User.fromPersistence(rawUser);

    request.user = user;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
