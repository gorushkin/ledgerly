import { CreateUserRequestDTO, UserResponseDTO } from 'src/application/dto';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { Id } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';
import { AuthErrors } from 'src/presentation/errors/auth.errors';
import { describe, it, beforeEach, vi, expect } from 'vitest';

import { RegisterUserUseCase } from '../registerUser';

describe('RegisterUserUseCase', () => {
  const email = 'test@example.com';
  const name = 'Test User';
  const password = 'Password123!';
  const id = Id.create().valueOf();

  const mockUser = { name: 'mocked user' };

  let registerUserUseCase: RegisterUserUseCase;

  let mockedSaveWithIdRetry: ReturnType<typeof vi.fn>;

  let mockUserRepository: {
    create: ReturnType<typeof vi.fn>;
    getByEmail: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockUserRepository = {
      create: vi.fn(),
      getByEmail: vi.fn(),
    };

    mockedSaveWithIdRetry = vi.fn().mockResolvedValue(mockUser);

    registerUserUseCase = new RegisterUserUseCase(
      mockUserRepository as unknown as UserRepositoryInterface,
      mockedSaveWithIdRetry,
    );
  });

  describe('execute', () => {
    const validRequest: CreateUserRequestDTO = {
      email,
      name,
      password,
    };

    it('should create a user successfully', async () => {
      // Arrange
      mockUserRepository.getByEmail.mockResolvedValue(null);

      const expectedResult: UserResponseDTO = {
        email,
        id,
        name,
      };

      // Mock saveWithIdRetry to return the expected result
      mockedSaveWithIdRetry.mockResolvedValue(expectedResult);

      // Act
      const result = await registerUserUseCase.execute(validRequest);

      // Assert
      expect(result).toEqual(expectedResult);

      expect(mockUserRepository.getByEmail).toHaveBeenCalledWith(email);

      // Verify saveWithIdRetry was called with correct arguments
      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        expect.any(Object), // User instance
        expect.any(Function), // bound create method
        expect.any(Function), // entityFactory function
      );

      // Optionally verify the User instance passed to saveWithIdRetry
      const userInstance = mockedSaveWithIdRetry.mock.calls[0][0] as User;
      expect(userInstance).toBeInstanceOf(User);
    });

    it('should throw error if user with email already exists', async () => {
      // Arrange
      mockUserRepository.getByEmail.mockResolvedValue({
        email: 'test@example.com',
        id: 'existing-user-id',
      });

      // Act & Assert
      await expect(registerUserUseCase.execute(validRequest)).rejects.toThrow(
        AuthErrors.UserExistsError,
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
