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

  describe('registerUser', () => {
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

    it.todo('should call findByEmail with correct email');

    it.todo('should hash password before storing');

    it.todo('should pass all data to repository create method');

    it.todo('should not call create method if user already exists');

    it.todo('should handle repository errors during user lookup');

    it.todo('should handle password hashing errors');

    it.todo('should handle repository errors during user creation');
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const mockUser = { email, hashedPassword, id, name };

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

    it('should throw InvalidPasswordError if password is invalid', async () => {
      const mockUser = { email, id, name, password: hashedPassword };

      mockUsersRepository.getUserByEmailWithPassword.mockResolvedValue(
        mockUser,
      );
      mockPasswordManager.compare.mockResolvedValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrowError(
        InvalidPasswordError,
      );
    });

    it.todo('should call getUserByEmailWithPassword with correct email');

    it.todo('should not call password compare if user not found');

    it.todo('should return user without password field');

    it.todo('should handle repository errors during user lookup');

    it.todo('should handle password comparison errors');

    it.todo(
      'should handle case when user exists but password field is missing',
    );
  });

  describe.todo('input validation and edge cases', () => {
    it.todo('should handle empty email in registerUser');

    it.todo('should handle empty email in validateUser');

    it.todo('should handle empty password in registerUser');

    it.todo('should handle empty password in validateUser');

    it.todo('should handle empty name in registerUser');

    it.todo('should handle null values gracefully');

    it.todo('should handle undefined values gracefully');
  });

  describe('security considerations', () => {
    it.todo('should always hash passwords before storage');

    it.todo('should not log or expose plain text passwords');

    it.todo('should use secure password comparison');
  });
});
