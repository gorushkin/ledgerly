import type { FastifyInstance } from 'fastify';

export const commodityRoutes = (app: FastifyInstance) => {
  const commodityController = app.container.controllers.commodity;

  app.get('/', async (request) => {
    const user = request.user;

    return await commodityController.getAll(user);
  });

  app.get('/:id', async (request) => {
    const user = request.user;

    return commodityController.getById(user, request.params);
  });

  app.post('/', async (request, reply) => {
    const user = request.user;

    const commodity = await commodityController.create(user, request.body);
    reply.status(201).send(commodity);
  });

  app.delete('/:id', async (request, reply) => {
    const user = request.user;

    await commodityController.archiveCommodity(user, request.params);

    reply.status(204).send();
  });

  // or patch
  app.put('/:id', async (request, reply) => {
    const user = request.user;

    const updatedCommodity = await commodityController.update(
      user,
      request.params,
      request.body,
    );
    reply.status(200).send(updatedCommodity);
  });
};
