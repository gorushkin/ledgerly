import { FastifyInstance } from "fastify";

export async function registerTransactionsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return { message: "Transactions route is under construction." };
  });
}
