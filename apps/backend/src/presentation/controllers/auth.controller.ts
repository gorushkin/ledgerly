import { loginSchema, registerSchema } from '@ledgerly/shared/validation';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from 'src/services/auth.service';
import { ZodError } from 'zod';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = loginSchema.parse(request.body);
      const user = await this.authService.validateUser(
        data.email,
        data.password,
      );

      const token = await reply.jwtSign({
        email: user.email,
        userId: user.id,
      });

      return { token };
    } catch (error) {
      if (error instanceof ZodError) {
        reply.status(400).send({
          error: true,
          message: 'Validation failed',
          path: error.errors[0]?.path,
        });
        return;
      }

      reply.status(401).send({
        error: true,
        message:
          error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = registerSchema.parse(request.body);
      const user = await this.authService.registerUser(data);

      const token = await reply.jwtSign({
        email: user.email,
        userId: user.id,
      });

      return { token };
    } catch (error) {
      if (error instanceof ZodError) {
        const formatted = error.issues.map((issue) => ({
          code: issue.code,
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return reply.status(400).send({ errors: formatted });
      }

      reply.status(400).send({
        error: true,
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }
}
