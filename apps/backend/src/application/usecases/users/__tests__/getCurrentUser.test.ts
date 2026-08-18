import { UserResponseDTO } from '@ledgerly/shared/types';
import { EntityNotFoundError } from 'src/application/application.errors';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain';
import { createUser } from 'src/testing/helpers';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetCurrentUserUseCase } from '../getCurrentUser';

describe('GetCurrentUserUseCase', () => {
  let user: User;

  const userRepository = {
    getById: vi.fn(),
  };

  const getCurrentUserUseCase = new GetCurrentUserUseCase(
    userRepository as unknown as UserRepositoryInterface,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    userRepository.getById.mockClear();
  });

  describe('execute', () => {
    it('should return the current user when user ', async () => {
      userRepository.getById.mockResolvedValue({
        email: user.email.valueOf(),
        id: user.getId().valueOf(),
        name: user.name.valueOf(),
      });

      const result = await getCurrentUserUseCase.execute(user);

      const expectedResult: UserResponseDTO = {
        email: user.email.valueOf(),
        id: user.getId().valueOf(),
        name: user.name.valueOf(),
      };

      expect(userRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
      );

      expect(result).toEqual(expectedResult);
    });

    it('should throw an error when user is not found', async () => {
      userRepository.getById.mockResolvedValue(null);

      await expect(getCurrentUserUseCase.execute(user)).rejects.toThrowError(
        EntityNotFoundError,
      );

      expect(userRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
      );
    });
  });
});
