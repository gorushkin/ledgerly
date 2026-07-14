import type { FastifyInstance } from 'fastify';

export const registerUserRoutes = (app: FastifyInstance) => {
  const userController = app.container.controllers.user;

  app.get('/', async (request) => {
    const user = request.user;

    return userController.getById(user);
  });

  app.put('/', async (request, reply) => {
    const user = request.user;

    const updatedUser = await userController.update(user, request.body);
    reply.status(200).send(updatedUser);
  });

  app.put('/password', async (request, reply) => {
    const user = request.user;

    await userController.changePassword(user, request.body);

    reply.status(200).send({
      message: 'Password successfully changed',
    });
  });

  app.delete('/', async (request, reply) => {
    const user = request.user;
    await userController.delete(user);

    reply.status(200).send({
      id: user.getId().valueOf(),
      message: 'Profile successfully deleted',
    });
  });
};
