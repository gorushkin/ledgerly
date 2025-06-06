import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { UserService } from 'src/services/user.service';
import { describe, vi, beforeEach, expect, it } from 'vitest';

describe('UserService', () => {
  const mockUsersRepository = {
    deleteUser: vi.fn(),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
  };

  const mockPasswordManager = {
    hash: vi.fn(),
  };

  const service = new UserService(
    mockUsersRepository as unknown as UsersRepository,
    mockPasswordManager as unknown as PasswordManager,
  );

  const id = '1';
  const email = 'test@example.com';
  const name = 'Test User';
  const password = 'password123';
  const hashedPassword = 'hashed_password';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = { email, id, name };
      mockUsersRepository.getUserById.mockResolvedValue(mockUser);

      const result = await service.getById(id);

      expect(mockUsersRepository.getUserById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUsersRepository.getUserById.mockResolvedValue(null);

      const result = await service.getById(id);

      expect(mockUsersRepository.getUserById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user data with hashed password', async () => {
      const userData = { email, name, password };
      const mockUpdatedUser = { ...userData, id };

      mockPasswordManager.hash.mockResolvedValue(hashedPassword);
      mockUsersRepository.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await service.update(id, userData);

      expect(mockPasswordManager.hash).toHaveBeenCalledWith(password);
      expect(mockUsersRepository.updateUser).toHaveBeenCalledWith(id, {
        ...userData,
        password: hashedPassword,
      });
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const mockUser = { email, id, name };
      mockUsersRepository.deleteUser.mockResolvedValue(mockUser);

      const result = await service.delete(id);

      expect(mockUsersRepository.deleteUser).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUsersRepository.deleteUser.mockResolvedValue(null);

      const result = await service.delete(id);

      expect(mockUsersRepository.deleteUser).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });
});
