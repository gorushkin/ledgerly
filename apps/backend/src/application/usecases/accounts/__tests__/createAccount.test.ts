import { CurrencyCode } from '@ledgerly/shared/types';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountUseCase } from '../createAccount';

describe('CreateAccountUseCase', () => {
  let createAccountUseCase: CreateAccountUseCase;
  let mockAccountRepository: { create: ReturnType<typeof vi.fn> };
  let mockedSaveWithIdRetry: ReturnType<typeof vi.fn>;
  let mockUserRepository: { getUserById: ReturnType<typeof vi.fn> };

  const userIdValue = '550e8400-e29b-41d4-a716-446655440000';
  const accountIdValue = '660e8400-e29b-41d4-a716-446655440001';

  const userId = Id.restore(userIdValue).valueOf();
  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset';

  const mockUser = {
    createdAt: new Date().toISOString(),
    email: 'test@example.com',
    id: userId,
    name: 'Test User',
  };

  const mockSavedAccountData = {
    createdAt: new Date().toISOString(),
    currency,
    currentClearedBalanceLocal: initialBalance,
    description,
    id: accountIdValue,
    initialBalance,
    isTombstone: false,
    name: accountName,
    type: accountType,
    updatedAt: new Date().toISOString(),
    userId,
  };

  beforeEach(() => {
    mockAccountRepository = {
      create: vi.fn(),
    };

    mockUserRepository = {
      getUserById: vi.fn(),
    };

    mockedSaveWithIdRetry = vi
      .fn()
      .mockResolvedValue({ name: 'mocked account' }); // Mock implementation

    createAccountUseCase = new CreateAccountUseCase(
      mockAccountRepository as unknown as AccountRepository,
      mockUserRepository as unknown as UsersRepository,
      mockedSaveWithIdRetry,
    );
  });

  describe('execute', () => {
    it('should create a new account successfully', async () => {
      // Arrange
      mockUserRepository.getUserById.mockResolvedValue(mockUser);
      const expectedResult = {
        ...mockSavedAccountData,
        isTombstone: false,
      };
      mockedSaveWithIdRetry.mockResolvedValue(expectedResult);

      // Act
      const result = await createAccountUseCase.execute(userId, {
        currency: currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
        userId,
      });

      // Assert
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(
        userId,
        undefined,
      );
      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        expect.any(Object), // Account instance
        expect.any(Function), // bound create method
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when user does not exist', async () => {
      mockUserRepository.getUserById.mockResolvedValue(null);

      await expect(
        createAccountUseCase.execute(userId, {
          currency,
          description,
          initialBalance,
          name: accountName,
          type: accountType,
          userId,
        }),
      ).rejects.toThrow('User not found');

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(
        userId,
        undefined,
      );
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it.skip('should handle Account.create validation errors', async () => {
      mockUserRepository.getUserById.mockResolvedValue(mockUser);

      const validationError = new Error('Account name cannot be empty');
      vi.spyOn(Account, 'create').mockImplementation(() => {
        throw validationError;
      });

      await expect(
        createAccountUseCase.execute(userId, {
          currency,
          description: '',
          initialBalance,
          name: accountName,
          type: accountType,
          userId,
        }),
      ).rejects.toThrow('Account name cannot be empty');

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(
        userId,
        undefined,
      );
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it('should handle UUID collision gracefully', async () => {
      mockUserRepository.getUserById.mockResolvedValue(mockUser);

      const expectedResult = {
        ...mockSavedAccountData,
        isTombstone: false,
      };

      mockedSaveWithIdRetry.mockResolvedValue(expectedResult);

      const mockedAccount = {} as unknown as Account;

      vi.spyOn(Account, 'create').mockReturnValue(mockedAccount);

      const result = await createAccountUseCase.execute(userId, {
        currency: currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
        userId,
      });

      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        mockedAccount,
        expect.any(Function),
      );

      const [, repositoryMethod] = mockedSaveWithIdRetry.mock.calls[0] as [
        unknown,
        (account: Account) => Promise<unknown>,
      ];
      expect(typeof repositoryMethod).toBe('function');

      await repositoryMethod(mockedAccount);
      expect(mockAccountRepository.create).toHaveBeenCalledWith(mockedAccount);

      expect(result).toEqual(expectedResult);
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when currency does not exist/is invalid
    // - should validate all required fields (name, description, type, etc.)
    // - should handle different account types properly
    // - should set currentClearedBalanceLocal to initialBalance
    // - should handle repository errors during creation
    // - should validate currency code format
  });
});
