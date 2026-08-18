import { UserUpdateDTO } from '@ledgerly/shared/types';
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
});
