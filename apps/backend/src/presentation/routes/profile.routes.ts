import { usersCreateSchema } from '@ledgerly/shared/validation';
import type { FastifyInstance } from 'fastify';

export const registerProfileRoutes = (app: FastifyInstance) => {
  const userController = app.container.controllers.user;

  app.get('/', async (request) => {
    const userId = request.user.userId;
    return await userController.getById(userId);
  });

  app.put('/', async (request, reply) => {
    const userId = request.user.userId;
    const updatedUserDTO = usersCreateSchema.parse(request.body);

    const updatedUser = await userController.update(userId, updatedUserDTO);
    reply.status(200).send(updatedUser);
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
