import { apiErrorCodes, UserCreateDTO } from '@ledgerly/shared/types';
import type { UserRepositoryInterface } from 'src/application/interfaces';
import { User } from 'src/domain/users/user.entity';
import { RecordAlreadyExistsError } from 'src/infrastructure/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegisterUserUseCase } from '../registerUser';

describe('RegisterUserUseCase', () => {
  const email = 'test@example.com';
  const name = 'Test User';
  const password = 'Password123!';

  const mockUserRepository = {
    create: vi.fn(),
  };

  const registerUserUseCase = new RegisterUserUseCase(
    mockUserRepository as unknown as UserRepositoryInterface,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    const validRequest: UserCreateDTO = {
      email,
      name,
      password,
    };

    it('should create a user successfully', async () => {
      mockUserRepository.create.mockResolvedValue(undefined);

      const result = await registerUserUseCase.execute(validRequest);

      expect(result).toEqual({
        email,
        id: result.id,
        name,
      });
      expect(typeof result.id).toBe('string');
      expect(result).not.toHaveProperty('password');

      expect(mockUserRepository.create).toHaveBeenCalledOnce();

      const [createPayload] = mockUserRepository.create.mock.calls[0] as [User];

      expect(createPayload.email.valueOf()).toBe(email);
      expect(createPayload.name.valueOf()).toBe(name);
      expect(typeof createPayload.getId().valueOf()).toBe('string');
    });

    it('should map duplicate email repository errors to ENTITY_ALREADY_EXISTS', async () => {
      mockUserRepository.create.mockRejectedValue(
        new RecordAlreadyExistsError({
          context: {
            field: 'email',
            tableName: 'users',
            value: email,
          },
        }),
      );

      await expect(
        registerUserUseCase.execute(validRequest),
      ).rejects.toMatchObject({
        code: apiErrorCodes.entityAlreadyExists,
        context: {
          entityType: 'user',
          field: 'email',
        },
      });

      expect(mockUserRepository.create).toHaveBeenCalledOnce();
    });

    it.todo('should hash password before storing');

    it.todo('should pass all data to repository create method');

    it.todo('should handle password hashing errors');

    it.todo('should handle repository errors during user creation');
  });

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
