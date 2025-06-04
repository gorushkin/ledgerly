import '@fastify/jwt';
import { AppContainer } from 'src/di/types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
    };
    user: {
      userId: string;
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
