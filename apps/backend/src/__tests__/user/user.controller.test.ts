import { UserChangePasswordDTO, UsersUpdateDTO } from '@ledgerly/shared/types';
import { Id } from 'src/domain/domain-core';
import { UserController } from 'src/presentation/controllers/user.controller';
import { UserService } from 'src/services/user.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';

describe('UserController', () => {
  const userId = Id.create().valueOf();

  const mockUserService = {
    changePassword: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  };

  const controller = new UserController(
    mockUserService as unknown as UserService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById', () => {
    it('should return user data', async () => {
      const mockUser = {
        email: 'test@example.com',
        id: '1',
        name: 'Test User',
      };

      mockUserService.getById.mockResolvedValue(mockUser);

      const result = await controller.getById(userId);

      expect(mockUserService.getById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    const userData = {
      email: 'updated@example.com',
      name: 'Updated User',
    };

    it('should update user data', async () => {
      const existingUser = {
        email: 'old@example.com',
        id: '1',
        name: 'Old Name',
      };

      const updatedUser = {
        email: userData.email,
        id: '1',
        name: userData.name,
      };

      mockUserService.getById.mockResolvedValue(existingUser);
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, userData);

      expect(mockUserService.update).toHaveBeenCalledWith(userId, userData);
      expect(result).toEqual(updatedUser);
    });

    it('should handle case-sensitive email updates', async () => {
      const existingUser = {
        email: 'OLD@example.com',
        name: 'Old Name',
      };

      const normalizedEmail = existingUser.email.toLocaleLowerCase();
      const updatedUser = {
        ...existingUser,
        email: normalizedEmail,
      };

      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(userId, existingUser);

      expect(result).toEqual(updatedUser);
      expect(mockUserService.update).toHaveBeenCalledWith(userId, updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const existingUser = {
        email: 'test@example.com',
        id: '1',
        name: 'Test User',
      };

      mockUserService.getById.mockResolvedValue(existingUser);
      mockUserService.delete.mockResolvedValue(existingUser);

      const result = await controller.delete(userId);

      expect(mockUserService.delete).toHaveBeenCalledWith(userId);
      expect(result).toEqual(existingUser);
    });
  });

  describe('changePassword', () => {
    it.todo('should call userService.changePassword with correct parameters');
    it.todo('should handle validation through passwordChangeSchema');
  });

  describe('update validation', () => {
    it('should throw ZodError for invalid email', async () => {
      const invalidData = {
        email: 'not-an-email',
        name: 'Valid Name',
      };

      await expect(
        controller.update(Id.create().valueOf(), invalidData),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for invalid name type', async () => {
      const invalidData = {
        email: 'valid@email.com',
        name: 123,
      } as unknown as UsersUpdateDTO;

      await expect(controller.update(userId, invalidData)).rejects.toThrow(
        ZodError,
      );
    });

    it('should throw ZodError for empty object', async () => {
      await expect(controller.update(userId, {})).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for unexpected fields', async () => {
      const invalidData = {
        email: 'valid@email.com',
        name: 'Valid Name',
        unexpectedField: 'should not be here',
      };

      await expect(
        controller.update(Id.create().valueOf(), invalidData),
      ).rejects.toThrow(ZodError);
    });

    it.todo('should validate email format strictly');
    it.todo('should validate name is not empty when provided');
    it.todo('should validate at least one field is provided');
    it.todo('should handle null/undefined requestBody');
    it.todo('should trim and lowercase email automatically');
  });

  describe('changePassword validation', () => {
    it('should throw ZodError for missing oldPassword', async () => {
      const invalidData = {
        newPassword: 'newPassword123',
      } as unknown as UserChangePasswordDTO;

      await expect(
        controller.changePassword(userId, invalidData),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for missing newPassword', async () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
      } as UserChangePasswordDTO;

      await expect(
        controller.changePassword(userId, invalidData),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for short passwords', async () => {
      const invalidData = {
        currentPassword: '123',
        newPassword: '456',
      };

      await expect(
        controller.changePassword(userId, invalidData),
      ).rejects.toThrow(ZodError);
    });

    it.todo('should validate currentPassword is not empty');
    it.todo('should validate newPassword meets minimum length');
    it.todo('should validate newPassword maximum length');
    it.todo('should validate both passwords are strings');
    it.todo('should handle null/undefined requestBody');
    it.todo('should reject extra unexpected fields');
  });
});
