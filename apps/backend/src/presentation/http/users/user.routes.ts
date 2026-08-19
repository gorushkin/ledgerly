import { apiSuccessCodes } from '@ledgerly/shared/types';
import type { FastifyInstance } from 'fastify';

export const registerUserRoutes = (app: FastifyInstance) => {
  const userController = app.container.controllers.user;

  // TODO: consider adding /me route for getting current user info, instead of just / route. This would make it more clear that this route is for getting the current user's info, and not for getting a list of all users.
  app.get('/', (request) => {
    const user = request.user;

    return userController.getCurrentUser(user);
  });

  app.put('/', async (request, reply) => {
    const user = request.user;

    const updatedUser = await userController.updateCurrentUser(
      user,
      request.body,
    );
    reply.status(200).send(updatedUser);
  });

  app.put('/password', async (request, reply) => {
    const user = request.user;

    await userController.changePassword(user, request.body);

    reply.status(200).send({
      code: apiSuccessCodes.userPasswordChanged,
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
