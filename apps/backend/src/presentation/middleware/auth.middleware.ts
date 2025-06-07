import { FastifyReply, FastifyRequest } from 'fastify';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = await request.jwtVerify<{ userId: string }>();
    request.user = decoded;
  } catch (_err) {
    reply.status(401).send({ error: true, message: 'Unauthorized' });
  }
}
