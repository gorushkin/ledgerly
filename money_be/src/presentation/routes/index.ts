import { FastifyInstance } from "fastify";
import { registerEntriesRoutes } from "./entries";
import { registerTransactionsRoutes } from "./transactions";
import { registerUsersRoutes } from "./users";
import { ROUTES } from "./paths";
export { registerUsersRoutes } from "./users";

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    reply.send({ message: "Welcome to the Money Manager API!" });
  });

  fastify.register(registerEntriesRoutes, { prefix: ROUTES.entries });
  fastify.register(registerTransactionsRoutes, { prefix: ROUTES.transactions });
  fastify.register(registerUsersRoutes, { prefix: ROUTES.users });
}
