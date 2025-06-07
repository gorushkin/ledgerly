import bcrypt from 'bcryptjs';
import {
  InvalidPasswordError,
  UserExistsError,
  UserNotFoundError,
} from 'src/presentation/errors/auth.errors';
import { describe, vi, beforeEach, expect, it } from 'vitest';

import { UsersRepository } from '../../infrastructure/db/UsersRepository';
import { AuthService } from '../../services/auth.service';

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}));

describe('AuthService', () => {
  const mockUsersRepository = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    updatePassword: vi.fn(),
  };

  const service = new AuthService(
    mockUsersRepository as unknown as UsersRepository,
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
      mockUsersRepository.create.mockResolvedValue(mockUser);

      const result = await service.registerUser({
        email,
        name,
        password,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
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
      ).rejects.toThrow(UserExistsError);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const mockUser = { email, id, name, password: hashedPassword };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        true,
      );

      const result = await service.validateUser(email, password);

      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual(mockUser);
    });

    it('should throw UserNotFoundError if user not found', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it('should throw InvalidPasswordError if password is invalid', async () => {
      const mockUser = { email, id, name, password: hashedPassword };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      (bcrypt.compare as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        false,
      );

      await expect(service.validateUser(email, password)).rejects.toThrow(
        InvalidPasswordError,
      );
    });
  });
});
