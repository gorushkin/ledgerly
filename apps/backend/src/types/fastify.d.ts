import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string;
    };
  }
  interface FastifyInstance {
    container: AppContainer;
  }
}
