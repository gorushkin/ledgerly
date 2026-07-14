import { loginSchema, registerSchema } from '@ledgerly/shared/validation';
import { env } from 'env.config';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
} from 'src/application/usecases';
import type { JWTPayload } from 'src/types';

type JwtSignOptions = {
  expiresIn: string;
};

export type AuthJwtSigner = (
  payload: JWTPayload,
  options: JwtSignOptions,
) => Promise<string>;

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  async login(requestBody: unknown, signJwt: AuthJwtSigner) {
    const data = loginSchema.parse(requestBody);
    const user = await this.loginUserUseCase.execute(data.email, data.password);

    const token = await signJwt(
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

  async register(requestBody: unknown, signJwt: AuthJwtSigner) {
    const data = registerSchema.parse(requestBody);
    const user = await this.registerUserUseCase.execute(data);

    const token = await signJwt(
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
