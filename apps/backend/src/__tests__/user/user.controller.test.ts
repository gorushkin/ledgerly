import { UserController } from 'src/presentation/controllers/user.controller';
import { UserService } from 'src/services/user.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';

describe('UserController', () => {
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

      const result = await controller.getById('1');

      expect(mockUserService.getById).toHaveBeenCalledWith('1');
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

      const result = await controller.update('1', userData);

      expect(mockUserService.update).toHaveBeenCalledWith('1', userData);
      expect(result).toEqual(updatedUser);
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

      const result = await controller.delete('1');

      expect(mockUserService.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(existingUser);
    });
  });

  describe('update validation', () => {
    it('should throw ZodError for invalid email', async () => {
      const invalidData = {
        email: 'not-an-email',
        name: 'Valid Name',
      };

      await expect(controller.update('1', invalidData)).rejects.toThrow(
        ZodError,
      );
    });

    it('should throw ZodError for invalid name type', async () => {
      const invalidData = {
        email: 'valid@email.com',
        name: 123, // должно быть строкой
      };

      await expect(controller.update('1', invalidData)).rejects.toThrow(
        ZodError,
      );
    });

    it('should throw ZodError for empty object', async () => {
      await expect(controller.update('1', {})).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for unexpected fields', async () => {
      const invalidData = {
        email: 'valid@email.com',
        name: 'Valid Name',
        unexpectedField: 'should not be here',
      };

      await expect(controller.update('1', invalidData)).rejects.toThrow(
        ZodError,
      );
    });
  });

  describe('changePassword validation', () => {
    it.skip('should throw ZodError for missing oldPassword', async () => {
      const invalidData = {
        newPassword: 'newPassword123',
      };

      await expect(controller.changePassword('1', invalidData)).rejects.toThrow(
        ZodError,
      );
    });

    it.skip('should throw ZodError for missing newPassword', async () => {
      const invalidData = {
        oldPassword: 'oldPassword123',
      };

      await expect(controller.changePassword('1', invalidData)).rejects.toThrow(
        ZodError,
      );
    });

    it.skip('should throw ZodError for short passwords', async () => {
      const invalidData = {
        newPassword: '456',
        oldPassword: '123',
      };

      await expect(controller.changePassword('1', invalidData)).rejects.toThrow(
        ZodError,
      );
    });

    it('should successfully parse valid password data', async () => {
      const validData = {
        currentPassword: 'validOldPassword123',
        newPassword: 'validNewPassword123',
      };

      mockUserService.changePassword.mockResolvedValue(undefined);

      await controller.changePassword('1', validData);

      expect(mockUserService.changePassword).toHaveBeenCalledWith(
        '1',
        validData,
      );
    });
  });
});
