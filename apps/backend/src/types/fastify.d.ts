/* eslint-disable @typescript-eslint/consistent-type-definitions */
import '@fastify/jwt';
import { UUID } from '@ledgerly/shared/types';
import { AppContainer } from 'src/di/types';
import { User } from 'src/domain/users/user.entity';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: UUID;
      email: string;
    };
    user: User;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    container: AppContainer;
  }

  interface FastifyInstance {
    container: AppContainer;
  }
}
