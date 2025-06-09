import type { FastifyInstance } from 'fastify';

export const registerUserRoutes = (app: FastifyInstance) => {
  const userController = app.container.controllers.user;

  app.get('/', async (request) => {
    const userId = request.user.userId;

    return await userController.getById(userId);
  });

  app.put('/', async (request, reply) => {
    const userId = request.user.userId;

    const updatedUser = await userController.update(userId, request.body);
    reply.status(200).send(updatedUser);
  });

  app.put('/password', async (request, reply) => {
    const userId = request.user.userId;

    await userController.changePassword(userId, request.body);

    reply.status(200).send({
      message: 'Password successfully changed',
    });
  });

  app.delete('/', async (request, reply) => {
    const userId = request.user.userId;
    await userController.delete(userId);

    reply.status(200).send({
      id: userId,
      message: 'Profile successfully deleted',
    });
  });
};
