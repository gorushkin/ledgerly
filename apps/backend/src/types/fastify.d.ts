/* eslint-disable @typescript-eslint/consistent-type-definitions */
import '@fastify/jwt';
import { UUID } from '@ledgerly/shared/types';
import { AppContainer } from 'src/di/types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: UUID;
      email: string;
    };
    user: {
      userId: UUID;
      email: string;
    };
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
