import { FastifyInstance } from "fastify";

import { z } from "zod";
import { accountSchema } from "../../../../../packages/shared/types/account";
import { accountController } from "../controllers/account.controller";

const idSchema = z.object({
  id: z.string().uuid(), // Updated to validate UUID strings
});

export async function registerAccountsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return await accountController.getAll();
  });

  app.get("/:id", async (request) => {
    const { id } = idSchema.parse(request.params);

    return await accountController.getById(id);
  });

  app.post("/", async (request, reply) => {
    console.log("request: ", request.body);
    const newAccount = accountSchema.parse(request.body);

    const createdAccount = await accountController.create(newAccount);
    reply.status(201).send(createdAccount);
  });
}
