import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthController } from 'src/presentation/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AuthController', () => {
  const mockAuthService = {
    registerUser: vi.fn(),
    validateUser: vi.fn(),
  };

  const mockReply = {
    jwtSign: vi.fn(),
    send: vi.fn(),
    status: vi.fn().mockReturnThis(),
  };

  const controller = new AuthController(
    mockAuthService as unknown as AuthService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const email = 'test@example.com';
  const password = 'password123';
  const name = 'Test User';
  const id = '123';
  const token = 'mock-token';

  describe('register', () => {
    it('should validate request payload and pass correct data to service', async () => {
      const mockUser = {
        email,
        id,
        name,
      };

      const mockRequest = {
        body: {
          email,
          name,
          password,
        },
      };

      mockAuthService.registerUser.mockResolvedValue(mockUser);
      mockReply.jwtSign.mockResolvedValue(token);

      const result = await controller.register(
        mockRequest as unknown as FastifyRequest,
        mockReply as unknown as FastifyReply,
      );

      expect(mockAuthService.registerUser).toHaveBeenCalledWith({
        email,
        name,
        password,
      });

      expect(mockReply.jwtSign).toHaveBeenCalledWith({
        email,
        userId: id,
      });

      expect(result).toEqual({ token });
    });

    it('should return 400 when service throws user exists error', async () => {
      const mockRequest = {
        body: {
          email,
          name,
          password,
        },
      };

      const error = new Error('User already exists');
      mockAuthService.registerUser.mockRejectedValue(error);

      await controller.register(
        mockRequest as FastifyRequest,
        mockReply as unknown as FastifyReply,
      );

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        error: true,
        message: 'User already exists',
      });
    });

    it('should return 400 when payload validation fails', async () => {
      const mockRequest = {
        body: {
          email: 'invalid-email',
          name: '',
          password: '123',
        },
      };

      await controller.register(
        mockRequest as unknown as FastifyRequest,
        mockReply as unknown as FastifyReply,
      );

      const sentPayload = (mockReply.send as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as {
        errors: { field: string; message: string; code: string }[];
      };

      expect(mockReply.status).toHaveBeenCalledWith(400);

      expect(sentPayload.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining(
              'Please enter a valid email address',
            ) as string,
          }),
        ]),
      );

      expect(mockAuthService.registerUser).not.toHaveBeenCalled();
    });
  });
});
