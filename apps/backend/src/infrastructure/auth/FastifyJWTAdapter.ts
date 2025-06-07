import { FastifyReply } from 'fastify';
import { JWTPayload, TokenGenerator } from 'src/types';

export class FastifyJWTAdapter implements TokenGenerator {
  constructor(private readonly reply: FastifyReply) {}

  async signToken(payload: JWTPayload): Promise<string> {
    return this.reply.jwtSign(payload);
  }
}
