import { FastifyInstance } from "fastify";
import { getAllEntries, getEntryById } from "../controllers/entry.controller";

import { z } from "zod";

const idSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export async function registerEntriesRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return await getAllEntries();
  });

  app.get("/:id", async (request) => {
    const { id } = idSchema.parse(request.params);

    return await getEntryById(id);
  });
}
