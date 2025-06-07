import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';

describe('AuthController', () => {
  const mockAuthService = {
    registerUser: vi.fn(),
    validateUser: vi.fn(),
  };

  const mockReply = {
    jwtSign: vi.fn().mockResolvedValue('mock-jwt-token'),
  };

  const controller = new AuthController(
    mockAuthService as unknown as AuthService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register validation', () => {
    it('should throw ZodError when email is invalid', async () => {
      const mockRequest = {
        body: {
          email: 'invalid-email',
          name: 'Test User',
          password: 'password123',
        },
      };

      await expect(
        controller.register(
          mockRequest as unknown as FastifyRequest,
          mockReply as unknown as FastifyReply,
        ),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError when name is empty', async () => {
      const mockRequest = {
        body: {
          email: 'test@example.com',
          name: '',
          password: 'password123',
        },
      };

      await expect(
        controller.register(
          mockRequest as unknown as FastifyRequest,
          mockReply as unknown as FastifyReply,
        ),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError when password is too short', async () => {
      const mockRequest = {
        body: {
          email: 'test@example.com',
          name: 'Test User',
          password: '123',
        },
      };

      await expect(
        controller.register(
          mockRequest as unknown as FastifyRequest,
          mockReply as unknown as FastifyReply,
        ),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('login validation', () => {
    it('should throw ZodError when email is invalid', async () => {
      const mockRequest = {
        body: {
          email: 'invalid-email',
          password: 'password123',
        },
      };

      await expect(
        controller.login(
          mockRequest as unknown as FastifyRequest,
          mockReply as unknown as FastifyReply,
        ),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError when password is empty', async () => {
      const mockRequest = {
        body: {
          email: 'test@example.com',
          password: '',
        },
      };

      await expect(
        controller.login(
          mockRequest as unknown as FastifyRequest,
          mockReply as unknown as FastifyReply,
        ),
      ).rejects.toThrow(ZodError);
    });
  });
});
