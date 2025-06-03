import { usersCreateSchema } from '@ledgerly/shared/validation';
import type { FastifyInstance } from 'fastify';
import { uniqueIdSchema } from 'src/libs/validators';

export const registerUsersRoutes = (app: FastifyInstance) => {
  const userController = app.container.controllers.user;

  app.get('/', async () => {
    return await userController.getAll();
  });

  app.get('/:id', async (request) => {
    const { id } = uniqueIdSchema.parse(request.params);

    return await userController.getById(id);
  });

  app.post('/', async (request, reply) => {
    const newUser = usersCreateSchema.parse(request.body);

    const createdUser = await userController.create(newUser);
    reply.status(201).send(createdUser);
  });

  app.put('/:id', async (request, reply) => {
    const { id } = uniqueIdSchema.parse(request.params);
    const updatedUserDTO = usersCreateSchema.parse(request.body);

    const updatedUser = await userController.update(id, updatedUserDTO);
    reply.status(200).send(updatedUser);
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = uniqueIdSchema.parse(request.params);

    await userController.delete(id);

    reply.status(200).send({
      id,
      message: 'User successfully deleted',
    });
  });
};
