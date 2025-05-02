import { FastifyInstance } from "fastify";

export async function registerUsersRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return { message: "Users route is under construction." };
  });
}
