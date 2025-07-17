import type { FastifyInstance } from 'fastify';

export const registerTransactionsRoutes = (app: FastifyInstance) => {
  const transactionController = app.container.controllers.transaction;

  app.get('/', (request) => {
    const userId = request.user.userId;

    return transactionController.getAll(userId);
  });

  // app.get('/:id', (request) => {
  //   const { id } = uniqueIdSchema.parse(request.params);

  //   return transactionController.getById(id);
  // });

  // app.post('/', (request) => {
  //   const parsedTransactionDTO = transactionCreateSchema.parse(request.body);

  //   return transactionController.create(parsedTransactionDTO);
  // });
};
