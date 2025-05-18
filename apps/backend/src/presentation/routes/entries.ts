import type { FastifyInstance } from 'fastify';
import { numericIdSchema } from 'src/libs/validators';

import { getAllEntries, getEntryById } from '../controllers/entry.controller';

export const registerEntriesRoutes = (app: FastifyInstance) => {
  app.get('/', async () => {
    return await getAllEntries();
  });

  app.get('/:id', async (request) => {
    const { id } = numericIdSchema.parse(request.params);

    return getEntryById(id);
  });
};
