import { loginSchema, registerSchema } from '@ledgerly/shared/validation';
import { env } from 'env.config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from 'src/services/auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(request: FastifyRequest, reply: FastifyReply) {
    const data = loginSchema.parse(request.body);
    const user = await this.authService.validateUser(data.email, data.password);

    const token = await reply.jwtSign(
      {
        email: user.email,
        userId: user.id,
      },
      {
        expiresIn: env.expiresIn || '1h',
      },
    );

    return { token };
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    const data = registerSchema.parse(request.body);
    const user = await this.authService.registerUser(data);

    const token = await reply.jwtSign(
      {
        email: user.email,
        userId: user.id,
      },
      {
        expiresIn: '1h',
      },
    );

    return { token };
  }
}
