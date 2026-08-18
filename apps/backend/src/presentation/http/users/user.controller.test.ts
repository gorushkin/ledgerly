import { UserChangePasswordDTO, UserUpdateDTO } from '@ledgerly/shared/types';
import type {
  GetCurrentUserUseCase,
  UpdateCurrentUserUseCase,
} from 'src/application/usecases/users/';
import { User } from 'src/domain/users/user.entity';
import { createUser } from 'src/testing';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { ZodError } from 'zod';

import { UserController } from './user.controller';

describe('UserController', () => {
  let user: User;

  const mockGetCurrentUserUseCase = {
    execute: vi.fn(),
  };

  const mockUpdateCurrentUserUseCase = {
    execute: vi.fn(),
  };

  const controller = new UserController(
    mockGetCurrentUserUseCase as unknown as GetCurrentUserUseCase,
    mockUpdateCurrentUserUseCase as unknown as UpdateCurrentUserUseCase,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should call getCurrentUserUseCase.execute with the correct user', () => {
      const mockUserResponse = {
        email: user.email.valueOf(),
        id: user.getId().valueOf(),
        name: user.name.valueOf(),
      };

      mockGetCurrentUserUseCase.execute.mockReturnValue(mockUserResponse);

      const result = controller.getCurrentUser(user);

      expect(mockGetCurrentUserUseCase.execute).toHaveBeenCalledWith(user);
      expect(result).toEqual(mockUserResponse);
    });

    it('should propagate errors from getCurrentUserUseCase', () => {
      const error = new Error('Test error');
      mockGetCurrentUserUseCase.execute.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.getCurrentUser(user)).toThrow(error);
    });
  });

  describe('update', () => {
    it('should call updateCurrentUserUseCase.execute with the correct parameters', async () => {
      const updatedProfileDTO: UserUpdateDTO = {
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      mockUpdateCurrentUserUseCase.execute.mockResolvedValue(updatedProfileDTO);

      const result = await controller.updateCurrentUser(
        user,
        updatedProfileDTO,
      );

      expect(mockUpdateCurrentUserUseCase.execute).toHaveBeenCalledWith(
        user,
        updatedProfileDTO,
      );
      expect(result).toEqual(updatedProfileDTO);
    });

    it('should propagate errors from updateCurrentUserUseCase', async () => {
      const error = new Error('Test error');
      mockUpdateCurrentUserUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.updateCurrentUser(user, {
          email: 'valid@example.com',
        }),
      ).rejects.toThrow(error);
    });

    const invalidUpdateRequestBodies = [
      ['invalid email', { email: 'not-an-email', name: 'Valid Name' }],
      ['empty email', { email: '', name: 'Valid Name' }],
      ['invalid name type', { email: 'valid@example.com', name: 123 }],
      ['empty name', { email: 'valid@example.com', name: '' }],
      ['empty object', {}],
      ['null body', null],
      ['undefined body', undefined],
      [
        'unexpected field',
        {
          email: 'valid@example.com',
          name: 'Valid Name',
          unexpectedField: 'should not be here',
        },
      ],
    ] as const;

    it.each(invalidUpdateRequestBodies)(
      'should throw ZodError for %s',
      async (_, invalidData) => {
        await expect(
          controller.updateCurrentUser(user, invalidData),
        ).rejects.toThrow(ZodError);

        expect(mockUpdateCurrentUserUseCase.execute).not.toHaveBeenCalled();
      },
    );
  });

  describe.todo('delete', () => {
    // it('should delete user', async () => {
    //   const existingUser = {
    //     email: 'test@example.com',
    //     id: '1',
    //     name: 'Test User',
    //   };
    //   mockUserService.getById.mockResolvedValue(existingUser);
    //   mockUserService.delete.mockResolvedValue(existingUser);
    //   const result = await controller.delete(userId);
    //   expect(mockUserService.delete).toHaveBeenCalledWith(userId);
    //   expect(result).toEqual(existingUser);
    // });
  });

  describe('changePassword', () => {
    it.todo('should call userService.changePassword with correct parameters');
    it.todo('should handle validation through passwordChangeSchema');
  });

  describe.todo('update validation', () => {
    it('should throw ZodError for invalid email', async () => {
      const invalidData = {
        email: 'not-an-email',
        name: 'Valid Name',
      };

      await expect(
        controller.updateCurrentUser(user, invalidData),
      ).rejects.toThrow(ZodError);
    });
    it('should throw ZodError for invalid email', async () => {
      const invalidData = {
        email: 'not-an-email',
        name: 'Valid Name',
      };

      await expect(
        controller.updateCurrentUser(user, invalidData),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for invalid name type', async () => {
      const invalidData: UserUpdateDTO = {
        email: 'valid@email.com',
        id: user.getId().valueOf(),
        name: 123,
      } as unknown as UserUpdateDTO;

      await expect(
        controller.updateCurrentUser(user, invalidData),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for empty object', async () => {
      await expect(controller.updateCurrentUser(user, {})).rejects.toThrow(
        ZodError,
      );
    });

    it('should throw ZodError for unexpected fields', async () => {
      const invalidData = {
        email: 'valid@email.com',
        name: 'Valid Name',
        unexpectedField: 'should not be here',
      };

      await expect(
        controller.updateCurrentUser(user, invalidData),
      ).rejects.toThrow(ZodError);
    });

    it.todo('should validate email format strictly');
    it.todo('should validate name is not empty when provided');
    it.todo('should validate at least one field is provided');
    it.todo('should handle null/undefined requestBody');
    it.todo('should trim and lowercase email automatically');
  });

  describe.todo('changePassword validation', () => {
    it('should throw ZodError for missing oldPassword', async () => {
      const invalidData = {
        newPassword: 'newPassword123',
      } as unknown as UserChangePasswordDTO;

      await expect(
        controller.changePassword(user, invalidData),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for missing newPassword', async () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
      } as UserChangePasswordDTO;

      await expect(
        controller.changePassword(user, invalidData),
      ).rejects.toThrow(ZodError);
    });

    it('should throw ZodError for short passwords', async () => {
      const invalidData = {
        currentPassword: '123',
        newPassword: '456',
      };

      await expect(
        controller.changePassword(user, invalidData),
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
