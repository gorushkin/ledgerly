import { FastifyInstance } from 'fastify';

export const authRoutes = (app: FastifyInstance) => {
  const controller = app.container.controllers.auth;

  app.post('/login', (request, reply) => {
    return controller.login(request, reply);
  });

  app.post('/register', (request, reply) => {
    return controller.register(request, reply);
  });
};
