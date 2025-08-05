import { FastifyReply, FastifyRequest } from 'fastify';

import { AuthErrors } from '../errors/auth.errors';

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AuthErrors.UnauthorizedError('Authentication required');
    }

    const decoded = await request.jwtVerify<{
      userId: string;
      email: string;
    }>();
    request.user = decoded;
  } catch {
    throw new AuthErrors.UnauthorizedError('Invalid or expired token');
  }
}
