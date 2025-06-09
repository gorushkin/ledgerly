import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import {
  UserExistsError,
  UserNotFoundError,
  InvalidPasswordError,
} from 'src/presentation/errors/auth.errors';
import { AuthService } from 'src/services/auth.service';
import { describe, vi, beforeEach, expect, it } from 'vitest';

describe('AuthService', () => {
  const mockUsersRepository = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    getUserByEmailWithPassword: vi.fn(),
    updatePassword: vi.fn(),
  };

  const mockPasswordManager = {
    compare: vi.fn(),
    hash: vi.fn(),
  };

  const service = new AuthService(
    mockUsersRepository as unknown as UsersRepository,
    mockPasswordManager as unknown as PasswordManager,
  );

  const email = 'test@example.com';
  const password = 'password123';
  const name = 'Test User';
  const id = '1';
  const hashedPassword = 'hashed_password';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.skip('registerUser', () => {
    it('should register a user successfully', async () => {
      const mockUser = { email, id, name, password: hashedPassword };

      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockPasswordManager.hash.mockResolvedValue(hashedPassword);
      mockUsersRepository.create.mockResolvedValue(mockUser);

      const result = await service.registerUser({
        email,
        name,
        password,
      });

      expect(mockPasswordManager.hash).toHaveBeenCalledWith(password);
      expect(mockUsersRepository.create).toHaveBeenCalledWith({
        email,
        name,
        password: hashedPassword,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UserExistsError if user already exists', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue({ email });

      await expect(
        service.registerUser({
          email,
          name,
          password,
        }),
      ).rejects.toThrowError(UserExistsError);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const mockUser = { email, id, name, password: hashedPassword };

      mockUsersRepository.getUserByEmailWithPassword.mockResolvedValue(
        mockUser,
      );
      mockPasswordManager.compare.mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(
        mockUsersRepository.getUserByEmailWithPassword,
      ).toHaveBeenCalledWith(email);
      expect(mockPasswordManager.compare).toHaveBeenCalledWith(
        password,
        hashedPassword,
      );
      expect(result).toEqual({
        email: mockUser.email,
        id: mockUser.id,
        name: mockUser.name,
      });
    });

    it('should throw UserNotFoundError if user not found', async () => {
      mockUsersRepository.getUserByEmailWithPassword.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it.skip('should throw InvalidPasswordError if password is invalid', async () => {
      const mockUser = { email, id, name, password: hashedPassword };

      mockUsersRepository.getUserByEmailWithPassword.mockResolvedValue(
        mockUser,
      );
      mockPasswordManager.compare.mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrowError(
        InvalidPasswordError,
      );
    });
  });
});
