import { FastifyReply, FastifyRequest } from 'fastify';

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
      userId: string;
      email: string;
    }>();
    request.user = decoded;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
