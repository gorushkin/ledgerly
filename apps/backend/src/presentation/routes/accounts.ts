import { FastifyInstance } from "fastify";
import {
  getAllAccounts,
  getAccountById,
  createAccount,
} from "../controllers/account.controller";

import { z } from "zod";
import { accountSchema } from "../../../../../packages/shared/types/account";

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

  app.post("/", async (request, reply) => {
    console.log("request: ", request.body);
    const newAccount = accountSchema.parse(request.body);

    const createdAccount = await createAccount(newAccount);
    reply.status(201).send(createdAccount);
  });
}
