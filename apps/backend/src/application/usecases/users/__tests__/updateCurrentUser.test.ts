import { apiErrorCodes } from '@ledgerly/shared/types';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';
import { RecordAlreadyExistsError } from 'src/infrastructure/errors';
import { createUser } from 'src/testing/helpers';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateCurrentUserUseCase } from '../updateCurrentUser';

describe('UpdateCurrentUserUseCase', () => {
  let user: User;

  const userRepository = {
    updateUserProfile: vi.fn(),
  };

  const updateCurrentUserUseCase = new UpdateCurrentUserUseCase(
    userRepository as unknown as UserRepositoryInterface,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    userRepository.updateUserProfile.mockReset();
  });

  describe('execute', () => {
    it('should update the current user and return the updated user response', async () => {
      const updatedProfileDTO = {
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      const result = await updateCurrentUserUseCase.execute(
        user,
        updatedProfileDTO,
      );

      expect(userRepository.updateUserProfile).toHaveBeenCalledWith(
        user.getId().valueOf(),
        expect.objectContaining({
          email: updatedProfileDTO.email,
          name: updatedProfileDTO.name,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          email: updatedProfileDTO.email,
          name: updatedProfileDTO.name,
        }),
      );
    });

    it('should propagate Error when user is not found', async () => {
      const error = new Error('User not found');
      const updatedProfileDTO = {
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      userRepository.updateUserProfile.mockRejectedValue(error);

      await expect(
        updateCurrentUserUseCase.execute(user, updatedProfileDTO),
      ).rejects.toThrowError(error);
    });

    it('should map duplicate email repository errors to ENTITY_ALREADY_EXISTS', async () => {
      const updatedProfileDTO = {
        email: 'existing@example.com',
      };

      userRepository.updateUserProfile.mockRejectedValue(
        new RecordAlreadyExistsError({
          context: {
            field: 'email',
            tableName: 'users',
            value: updatedProfileDTO.email,
          },
        }),
      );

      await expect(
        updateCurrentUserUseCase.execute(user, updatedProfileDTO),
      ).rejects.toMatchObject({
        code: apiErrorCodes.entityAlreadyExists,
        context: {
          entityType: 'user',
          field: 'email',
        },
      });
    });
  });
});
