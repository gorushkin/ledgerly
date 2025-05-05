import { FastifyInstance } from "fastify";
import {
  getAllAccounts,
  getAccountById,
} from "../controllers/account.controller";

import { z } from "zod";

const idSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export async function registerAccountsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return await getAllAccounts();
  });

  app.get("/:id", async (request) => {
    const { id } = idSchema.parse(request.params);

    return await getAccountById(id);
  });
}
