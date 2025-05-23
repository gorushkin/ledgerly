import type { FastifyInstance } from 'fastify';

export const registerTransactionsRoutes = (app: FastifyInstance) => {
  app.get('/', () => {
    return { message: 'Transactions route is under construction.' };
  });

  app.get('/:id', (request) => {
    const { id } = request.params as { id: string };

    return { message: `Transaction with ID ${id} is under construction.` };
  });

  app.post('/', (request) => {
    const { id } = request.params as { id: string };

    return { message: `Transaction with ID ${id} is under construction.` };
  });
};
