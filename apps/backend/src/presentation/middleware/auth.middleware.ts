import { UUID } from '@ledgerly/shared/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UserMapper } from 'src/application/mappers';

import { UnauthorizedError } from '../errors';

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

    const user = UserMapper.toDomain(rawUser);

    request.user = user;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError('Invalid or expired token');
  }
}
