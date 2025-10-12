import type { FastifyInstance } from 'fastify';

export const registerUserRoutes = (app: FastifyInstance) => {
  // const userController = app.container.controllers.user;

  app.get('/', (_request) => {
    // const userId = request.user.userId;

    // return await userController.getById(userId);
    throw new Error('Not implemented');
  });

  app.put('/', async (_request, _reply) => {
    // const userId = request.user.userId;

    // const updatedUser = await userController.update(userId, request.body);
    // reply.status(200).send(updatedUser);
    throw new Error('Not implemented');
  });

  app.put('/password', async (_request, _reply) => {
    // const userId = request.user.userId;

    // await userController.changePassword(userId, request.body);

    // reply.status(200).send({
    //   message: 'Password successfully changed',
    // });
    throw new Error('Not implemented');
  });

  app.delete('/', async (_request, _reply) => {
    // const userId = request.user.userId;
    // await userController.delete(userId);

    // reply.status(200).send({
    //   id: userId,
    //   message: 'Profile successfully deleted',
    // });
    throw new Error('Not implemented');
  });
};
