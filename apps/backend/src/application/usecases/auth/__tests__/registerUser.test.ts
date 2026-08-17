import { apiErrorCodes } from '@ledgerly/shared/types';
import { CreateUserRequestDTO } from 'src/application/dto';
import type { UserRepositoryInterface } from 'src/application/interfaces';
import { Id } from 'src/domain/domain-core/value-objects/Id';
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
    getByEmail: vi.fn(),
  };

  const registerUserUseCase = new RegisterUserUseCase(
    mockUserRepository as unknown as UserRepositoryInterface,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    const validRequest: CreateUserRequestDTO = {
      email,
      name,
      password,
    };

    it('should create a user successfully', async () => {
      const persistedUser = {
        email,
        id: Id.create().valueOf(),
        name,
      };

      mockUserRepository.create.mockResolvedValue(persistedUser);

      const result = await registerUserUseCase.execute(validRequest);

      expect(result).toBe(persistedUser);

      expect(mockUserRepository.getByEmail).not.toHaveBeenCalled();

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

      expect(mockUserRepository.getByEmail).not.toHaveBeenCalled();
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
