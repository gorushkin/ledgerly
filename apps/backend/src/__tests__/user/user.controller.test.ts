import { UserController } from 'src/presentation/controllers/user.controller';
import { UserService } from 'src/services/user.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('UserController', () => {
  const mockUserService = {
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

    it('should throw UserNotFoundError for non-existent user', async () => {
      mockUserService.getById.mockResolvedValue(undefined);

      await expect(() => controller.getById('999')).rejects.toThrowError(
        'User not found',
      );
      expect(mockUserService.getById).toHaveBeenCalledWith('999');
    });
  });

  describe('update', () => {
    const userData = {
      email: 'updated@example.com',
      name: 'Updated User',
      password: 'newpassword123',
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

      expect(mockUserService.getById).toHaveBeenCalledWith('1');
      expect(mockUserService.update).toHaveBeenCalledWith('1', userData);
      expect(result).toEqual(updatedUser);
    });

    it('should throw UserNotFoundError when updating non-existent user', async () => {
      mockUserService.getById.mockResolvedValue(undefined);

      await expect(() =>
        controller.update('999', userData),
      ).rejects.toThrowError('User not found');
      expect(mockUserService.getById).toHaveBeenCalledWith('999');
      expect(mockUserService.update).not.toHaveBeenCalled();
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

      expect(mockUserService.getById).toHaveBeenCalledWith('1');
      expect(mockUserService.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(existingUser);
    });

    it('should throw UserNotFoundError when deleting non-existent user', async () => {
      mockUserService.getById.mockResolvedValue(undefined);

      await expect(() => controller.delete('999')).rejects.toThrowError(
        'User not found',
      );
      expect(mockUserService.getById).toHaveBeenCalledWith('999');
      expect(mockUserService.delete).not.toHaveBeenCalled();
    });
  });
});
