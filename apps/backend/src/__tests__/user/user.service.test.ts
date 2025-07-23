import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import {
  EmailAlreadyExistsError,
  InvalidPasswordError,
  UserNotFoundError,
} from 'src/presentation/errors/auth.errors';
import { UserService } from 'src/services/user.service';
import { describe, vi, beforeEach, expect, it } from 'vitest';

describe('UserService', () => {
  const mockUsersRepository = {
    changePassword: vi.fn(),
    deleteUser: vi.fn(),
    findByEmail: vi.fn(),
    getUserById: vi.fn(),
    getUserByIdWithPassword: vi.fn(),
    updateUser: vi.fn(),
    updateUserPassword: vi.fn(),
    updateUserProfile: vi.fn(),
  };

  const mockPasswordManager = {
    compare: vi.fn(),
    hash: vi.fn(),
  };

  const service = new UserService(
    mockUsersRepository as unknown as UsersRepository,
    mockPasswordManager as unknown as PasswordManager,
  );

  const id = '1';
  const email = 'test@example.com';
  const name = 'Test User';
  const currentPassword = 'password123';
  const newPassword = 'hashed_password';
  const hashedPassword = 'hashedOld';
  const hashedNewPassword = 'hashedNew';

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

    it('should throw error UserNotFoundError if user not found', async () => {
      mockUsersRepository.getUserById.mockResolvedValue(null);

      await expect(service.getById(id)).rejects.toThrowError(UserNotFoundError);
    });

    it.todo('should call validateUser method internally');
  });

  describe('validateUser', () => {
    it.todo('should return user when exists');
    it.todo('should throw UserNotFoundError when user does not exist');
    it.todo('should call getUserById with correct id');
  });

  describe('update', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update user data with hashed password', async () => {
      const userData = { email, name };
      const mockUpdatedUser = { ...userData, id };

      mockUsersRepository.getUserById.mockResolvedValue(mockUpdatedUser);
      mockUsersRepository.updateUser.mockResolvedValue(mockUpdatedUser);
      mockUsersRepository.findByEmail.mockResolvedValue(mockUpdatedUser);
      mockUsersRepository.updateUserProfile.mockResolvedValue(mockUpdatedUser);

      const result = await service.update(id, userData);

      expect(mockUsersRepository.updateUserProfile).toHaveBeenCalledWith(id, {
        ...userData,
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should throw error UserNotFoundError if user not found', async () => {
      const nextEmail = 'test2@example.com';
      const nextId = '2';
      const userData = { email: nextEmail, name };

      mockUsersRepository.getUserById.mockResolvedValue(null);

      mockUsersRepository.updateUser.mockResolvedValue(null);

      await expect(service.update(nextId, userData)).rejects.toThrowError(
        UserNotFoundError,
      );
    });

    it('should throw error EmailAlreadyExistsError if email is already taken', async () => {
      const nextId = '2';

      const userData = { email, name };
      const mockUpdatedUser = { ...userData, id };

      mockUsersRepository.getUserById.mockResolvedValue(mockUpdatedUser);
      mockUsersRepository.findByEmail.mockResolvedValue({ id: '1' });

      await expect(service.update(nextId, userData)).rejects.toThrowError(
        EmailAlreadyExistsError,
      );
    });

    it.todo('should call validateUser before updating');
    it.todo('should allow update without email change');
    it.todo('should allow email update when email belongs to same user');
    it.todo('should handle partial updates (only name or only email)');
    it.todo('should call updateUserProfile with correct parameters');
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const mockUser = { email, id, name };
      mockUsersRepository.deleteUser.mockResolvedValue(mockUser);

      const result = await service.delete(id);

      expect(mockUsersRepository.deleteUser).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockUser);
    });

    it('should throw error UserNotFoundError if user not found', async () => {
      mockUsersRepository.getUserById.mockResolvedValue(null);

      await expect(service.delete(id)).rejects.toThrowError(UserNotFoundError);
    });

    it.todo('should call validateUser before deleting');
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = { currentPassword, newPassword };
      const mockUser = { email, id, name };
      const mockUserWithPassword = { ...mockUser, password: hashedPassword };

      mockUsersRepository.getUserById.mockResolvedValue(mockUser);
      mockUsersRepository.getUserByIdWithPassword.mockResolvedValue(
        mockUserWithPassword,
      );

      mockPasswordManager.compare.mockResolvedValue(true);
      mockPasswordManager.hash.mockResolvedValue('hashedNew');

      await service.changePassword(id, passwordData);

      expect(mockPasswordManager.compare).toHaveBeenCalledWith(
        currentPassword,
        hashedPassword,
      );
      expect(mockPasswordManager.hash).toHaveBeenCalledWith(newPassword);
      expect(mockUsersRepository.updateUserPassword).toHaveBeenCalledWith(
        id,
        hashedNewPassword,
      );
    });

    it('should throw error UserNotFoundError if user not found', async () => {
      const passwordData = { currentPassword, newPassword };

      mockUsersRepository.getUserByIdWithPassword.mockResolvedValue(null);

      await expect(
        service.changePassword(id, passwordData),
      ).rejects.toThrowError(UserNotFoundError);
    });

    it('should throw InvalidPasswordError when current password is wrong', async () => {
      const passwordData = { currentPassword: 'wrong', newPassword };
      const mockUserWithPassword = {
        email,
        id,
        name,
        password: hashedPassword,
      };

      mockUsersRepository.getUserByIdWithPassword.mockResolvedValue(
        mockUserWithPassword,
      );
      mockPasswordManager.compare.mockResolvedValue(false);

      await expect(service.changePassword(id, passwordData)).rejects.toThrow(
        InvalidPasswordError,
      );
    });

    it.todo('should call getUserByIdWithPassword with correct id');
    it.todo('should hash new password before storing');
    it.todo('should not update password if current password validation fails');
  });

  describe('canDeleteUser', () => {
    it.todo('should return null for any user (placeholder implementation)');
    it.todo('should be implemented to check deletion constraints');
    it.todo('should prevent deletion when user has dependencies');
  });
});
