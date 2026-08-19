import { UserUpdateDTO } from '@ledgerly/shared/types';
import type {
  ChangeUserPasswordUseCase,
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

  const mockChangeUserPasswordUseCase = {
    execute: vi.fn(),
  };

  const controller = new UserController(
    mockGetCurrentUserUseCase as unknown as GetCurrentUserUseCase,
    mockUpdateCurrentUserUseCase as unknown as UpdateCurrentUserUseCase,
    mockChangeUserPasswordUseCase as unknown as ChangeUserPasswordUseCase,
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

  describe('changePassword', () => {
    it('should call changeUserPasswordUseCase.execute with the correct parameters', async () => {
      const passwordChangeDTO = {
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
      };

      mockChangeUserPasswordUseCase.execute.mockResolvedValue({
        email: user.email.valueOf(),
        id: user.getId().valueOf(),
        name: user.name.valueOf(),
      });

      const result = await controller.changePassword(user, passwordChangeDTO);

      expect(mockChangeUserPasswordUseCase.execute).toHaveBeenCalledWith(
        user,
        passwordChangeDTO,
      );

      expect(result).toEqual({
        email: user.email.valueOf(),
        id: user.getId().valueOf(),
        name: user.name.valueOf(),
      });
    });

    const invalidPasswordChangeRequestBodies = [
      [
        'empty current password',
        { currentPassword: '', newPassword: 'Password123!' },
      ],
      [
        'short new password',
        { currentPassword: 'Password123!', newPassword: 'short' },
      ],
      [
        'new password too long',
        {
          currentPassword: 'Password123!',
          newPassword: 'a'.repeat(256),
        },
      ],
      ['missing current password', { newPassword: 'Password123!' }],
      ['missing new password', { currentPassword: 'Password123!' }],
      [
        'current password as number',
        { currentPassword: 123, newPassword: 'Password123!' },
      ],
      [
        'new password as number',
        { currentPassword: 'Password123!', newPassword: 123 },
      ],
      ['null body', null],
      ['undefined body', undefined],
      [
        'unexpected field',
        {
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!',
          unexpectedField: 'should not be here',
        },
      ],
    ] as const;

    it.each(invalidPasswordChangeRequestBodies)(
      'should throw ZodError for %s',
      async (_, invalidData) => {
        await expect(
          controller.changePassword(user, invalidData),
        ).rejects.toThrow(ZodError);

        expect(mockChangeUserPasswordUseCase.execute).not.toHaveBeenCalled();
      },
    );

    it('should propagate errors from changeUserPasswordUseCase', async () => {
      const error = new Error('Test error');
      mockChangeUserPasswordUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.changePassword(user, {
          currentPassword: 'currentPassword123',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(error);
    });
  });
});
