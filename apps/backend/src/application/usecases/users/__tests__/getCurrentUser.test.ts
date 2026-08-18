import { UserResponseDTO } from '@ledgerly/shared/types';
import { User } from 'src/domain';
import { createUser } from 'src/testing/helpers';
import { beforeAll, describe, expect, it } from 'vitest';

import { GetCurrentUserUseCase } from '../getCurrentUser';

describe('GetCurrentUserUseCase', () => {
  let user: User;

  const getCurrentUserUseCase = new GetCurrentUserUseCase();

  beforeAll(async () => {
    user = await createUser();
  });

  describe('execute', () => {
    it('returns the current user profile DTO', () => {
      const result = getCurrentUserUseCase.execute(user);

      const expectedResult: UserResponseDTO = {
        email: user.email.valueOf(),
        id: user.getId().valueOf(),
        name: user.name.valueOf(),
      };

      expect(result).toEqual(expectedResult);
      expect(result).not.toHaveProperty('password');
    });
  });
});
