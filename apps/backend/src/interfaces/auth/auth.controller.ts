import { loginSchema, registerSchema } from '@ledgerly/shared/validation';
import { env } from 'env.config';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
} from 'src/application/usecases';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  async login(request: FastifyRequest, reply: FastifyReply) {
    const data = loginSchema.parse(request.body);
    const user = await this.loginUserUseCase.execute(data.email, data.password);

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
    const user = await this.registerUserUseCase.execute(data);

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
