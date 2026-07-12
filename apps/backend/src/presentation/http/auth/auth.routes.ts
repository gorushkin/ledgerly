import { FastifyInstance } from 'fastify';

export const authRoutes = (app: FastifyInstance) => {
  const controller = app.container.controllers.auth;

  app.post('/login', (request, reply) => {
    return controller.login(request.body, (payload, options) =>
      reply.jwtSign(payload, { sign: options }),
    );
  });

  app.post('/register', (request, reply) => {
    return controller.register(request.body, (payload, options) =>
      reply.jwtSign(payload, { sign: options }),
    );
  });
};
