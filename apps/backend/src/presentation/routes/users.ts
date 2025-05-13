import type { FastifyInstance } from 'fastify';

export const registerUsersRoutes = (app: FastifyInstance) => {
  app.get('/', () => {
    return { message: 'Users route is under construction.' };
  });
};
