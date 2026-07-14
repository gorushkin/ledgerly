import { UserAlreadyExistsError } from 'src/application/application.errors';
import { CreateUserRequestDTO } from 'src/application/dto';
import type { UserRepositoryInterface } from 'src/application/interfaces';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { User } from 'src/domain/users/user.entity';
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

      mockUserRepository.getByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(persistedUser);

      const result = await registerUserUseCase.execute(validRequest);

      expect(result).toBe(persistedUser);

      expect(mockUserRepository.getByEmail).toHaveBeenCalledWith(email);

      expect(mockUserRepository.create).toHaveBeenCalledOnce();

      const [createPayload] = mockUserRepository.create.mock.calls[0] as [User];

      expect(createPayload.email.valueOf()).toBe(email);
      expect(createPayload.name.valueOf()).toBe(name);
      expect(typeof createPayload.getId().valueOf()).toBe('string');
    });

    it('should throw error if user with email already exists', async () => {
      // Arrange
      mockUserRepository.getByEmail.mockResolvedValue({
        email: 'test@example.com',
        id: Id.create().valueOf(),
      });

      // Act & Assert
      await expect(registerUserUseCase.execute(validRequest)).rejects.toThrow(
        UserAlreadyExistsError,
      );

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it.todo('should call findByEmail with correct email');

    it.todo('should hash password before storing');

    it.todo('should pass all data to repository create method');

    it.todo('should not call create method if user already exists');

    it.todo('should handle repository errors during user lookup');

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
