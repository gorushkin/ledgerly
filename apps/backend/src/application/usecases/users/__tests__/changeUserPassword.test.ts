import { type UserRepositoryInterface } from 'src/application';
import { User } from 'src/domain';
import {
  InvalidPasswordError,
  PasswordMismatchError,
} from 'src/domain/domain.errors';
import { createUser } from 'src/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ChangeUserPasswordUseCase } from '../changeUserPassword';

describe('ChangeUserPasswordUseCase', () => {
  let user: User;

  const userRepository = {
    updateUserPassword: vi.fn(),
  };

  const currentPassword = 'currentPassword123';

  const changeUserPasswordUseCase = new ChangeUserPasswordUseCase(
    userRepository as unknown as UserRepositoryInterface,
  );

  beforeEach(async () => {
    user = await createUser('Ivan', 'ivan@example.com', currentPassword);
    userRepository.updateUserPassword.mockReset();
  });

  describe('execute', () => {
    it('should change the user password and return the updated user response', async () => {
      const newPassword = 'newPassword123';

      const dto = {
        currentPassword,
        newPassword,
      };

      const result = await changeUserPasswordUseCase.execute(user, dto);

      const userSnapshot = user.toSnapshot();
      const password = userSnapshot.password.valueOf();

      expect(userRepository.updateUserPassword).toHaveBeenCalledWith(
        user.getId().valueOf(),
        expect.objectContaining({
          password,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          email: userSnapshot.email.valueOf(),
          id: userSnapshot.id.valueOf(),
          name: userSnapshot.name.valueOf(),
        }),
      );
    });

    it('should throw PasswordMismatchError when current password is incorrect', async () => {
      const incorrectPassword = 'incorrectPassword123';

      await expect(
        changeUserPasswordUseCase.execute(user, {
          currentPassword: incorrectPassword,
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrowError(PasswordMismatchError);
    });

    it('should not update the user password when current password validation fails', async () => {
      const incorrectPassword = 'incorrectPassword123';

      await expect(
        changeUserPasswordUseCase.execute(user, {
          currentPassword: incorrectPassword,
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrowError(PasswordMismatchError);

      expect(userRepository.updateUserPassword).not.toHaveBeenCalled();
    });

    it('should throw domain InvalidPasswordError when new password violates password policy', async () => {
      const invalidNewPassword = 'short';

      await expect(
        changeUserPasswordUseCase.execute(user, {
          currentPassword,
          newPassword: invalidNewPassword,
        }),
      ).rejects.toThrowError(InvalidPasswordError);
    });

    it('should not update the user password when new password validation fails', async () => {
      const invalidNewPassword = 'short';

      await expect(
        changeUserPasswordUseCase.execute(user, {
          currentPassword,
          newPassword: invalidNewPassword,
        }),
      ).rejects.toThrowError(InvalidPasswordError);

      expect(userRepository.updateUserPassword).not.toHaveBeenCalled();
    });

    it('should update updatedAt when changing the password', async () => {
      const newPassword = 'newPassword123';

      const beforeChange = user.toSnapshot().updatedAt;

      await changeUserPasswordUseCase.execute(user, {
        currentPassword,
        newPassword,
      });

      const afterChange = user.toSnapshot().updatedAt;
      expect(afterChange).not.toEqual(beforeChange);
    });

    it('should return a response without the password hash', async () => {
      const newPassword = 'newPassword123';

      const result = await changeUserPasswordUseCase.execute(user, {
        currentPassword,
        newPassword,
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should propagate repository errors when password persistence fails', async () => {
      const newPassword = 'newPassword123';
      const repositoryError = new Error('Repository error');

      userRepository.updateUserPassword.mockRejectedValue(repositoryError);

      await expect(
        changeUserPasswordUseCase.execute(user, {
          currentPassword,
          newPassword,
        }),
      ).rejects.toThrowError(repositoryError);
    });
  });
});
