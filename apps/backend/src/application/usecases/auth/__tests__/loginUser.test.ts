import {
  InvalidCredentialsError,
  UserNotFoundError,
} from 'src/application/application.errors';
import type { UserRepositoryInterface } from 'src/application/interfaces';
import { Id, Password, Timestamp } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginUserUseCase } from '../loginUser';

describe('LoginUserUseCase', () => {
  const email = 'test@example.com';
  const name = 'Test User';
  const id = Id.create().valueOf();
  const rawPassword = 'password123';
  const createdAt = Timestamp.create().valueOf();
  const updatedAt = Timestamp.create().valueOf();
  let password: Password;

  let loginUserUseCase: LoginUserUseCase;

  let mockUserRepository: {
    getByEmailWithPassword: ReturnType<typeof vi.fn>;
    getUserByEmailWithPassword: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    password = await Password.create(rawPassword);

    mockUserRepository = {
      getByEmailWithPassword: vi.fn(),
      getUserByEmailWithPassword: vi.fn(),
    };

    loginUserUseCase = new LoginUserUseCase(
      mockUserRepository as unknown as UserRepositoryInterface,
    );
  });

  describe('execute', () => {
    it('should return token if login is successful', async () => {
      mockUserRepository.getByEmailWithPassword.mockResolvedValue(
        User.restore({
          createdAt,
          email,
          id,
          name,
          password: password.valueOf(),
          updatedAt,
        }),
      );

      const result = await loginUserUseCase.execute(email, rawPassword);

      expect(result).toEqual({ email, id, name });
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      mockUserRepository.getByEmailWithPassword.mockResolvedValue(null);

      await expect(
        loginUserUseCase.execute(email, rawPassword),
      ).rejects.toThrow(UserNotFoundError);
    });

    it('should throw InvalidCredentialsError if password is invalid', async () => {
      mockUserRepository.getByEmailWithPassword.mockResolvedValue(
        User.restore({
          createdAt,
          email,
          id,
          name,
          password: password.valueOf(),
          updatedAt,
        }),
      );

      await expect(
        loginUserUseCase.execute(email, 'wrong-password'),
      ).rejects.toThrowError(InvalidCredentialsError);
    });
  });

  it.todo('should call getUserByEmailWithPassword with correct email');

  it.todo('should not call password compare if user not found');

  it.todo('should return user without password field');

  it.todo('should handle repository errors during user lookup');

  it.todo('should handle password comparison errors');

  it.todo('should handle case when user exists but password field is missing');

  describe.todo('input validation and edge cases', () => {
    it.todo('should handle empty email in registerUser');

    it.todo('should handle empty email in validateUser');

    it.todo('should handle empty password in registerUser');

    it.todo('should handle empty password in validateUser');

    it.todo('should handle empty name in registerUser');

    it.todo('should handle null values gracefully');

    it.todo('should handle undefined values gracefully');
  });

  describe('security considerations', () => {
    it.todo('should always hash passwords before storage');

    it.todo('should not log or expose plain text passwords');

    it.todo('should use secure password comparison');
  });
});
