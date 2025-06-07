import '@fastify/jwt';
import { AppContainer } from 'src/di/types';

declare module 'fastify' {
  interface FastifyRequest {
    container: AppContainer;
    user?: {
      userId: string;
    };
  }

  interface FastifyInstance {
    container: AppContainer;
  }
}
