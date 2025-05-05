import Fastify from "fastify";
import { registerRoutes } from "./routes";
import cors from "@fastify/cors";

import { ZodError } from "zod";
export function createServer() {
  const fastify = Fastify();

  fastify.setErrorHandler((error, request, reply) => {
    const status = (error as any).statusCode || 500;

    if (error instanceof ZodError) {
      const firstIssue = error.errors[0];
      reply.status(400).send({
        error: true,
        message: firstIssue?.message || "Validation failed",
        path: firstIssue?.path,
      });
      return;
    }

    reply.status(status).send({
      error: true,
      message: error.message || "Unexpected error",
    });
  });

  fastify.register(cors, {
    origin: "*",
  });

  fastify.register(registerRoutes, { prefix: "/api" });

  return fastify;
}
