import { CurrencyCode } from '@ledgerly/shared/types';
import { createUser } from 'src/db/createTestUser';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount } from 'src/domain/domain-core';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountUseCase } from '../createAccount';

describe('CreateAccountUseCase', async () => {
  const user = await createUser();

  let createAccountUseCase: CreateAccountUseCase;
  let mockAccountRepository: { create: ReturnType<typeof vi.fn> };
  let mockedSaveWithIdRetry: ReturnType<typeof vi.fn>;

  const accountIdValue = '660e8400-e29b-41d4-a716-446655440001';

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset';

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
    userId: user.id,
  };

  beforeEach(() => {
    mockAccountRepository = {
      create: vi.fn(),
    };

    mockedSaveWithIdRetry = vi
      .fn()
      .mockResolvedValue({ name: 'mocked account' }); // Mock implementation

    createAccountUseCase = new CreateAccountUseCase(
      mockAccountRepository as unknown as AccountRepository,
      mockedSaveWithIdRetry,
    );
  });

  describe('execute', () => {
    it('should create a new account successfully', async () => {
      // Arrange
      const expectedResult = {
        ...mockSavedAccountData,
        isTombstone: false,
      };
      mockedSaveWithIdRetry.mockResolvedValue(expectedResult);

      // Act
      const result = await createAccountUseCase.execute(user, {
        currency: currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
        userId: user.id,
      });

      // Assert
      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        expect.any(Object), // Account instance
        expect.any(Function), // bound create method
        expect.any(Function), // entityFactory function
      );
      expect(result).toEqual(expectedResult);
    });

    it.skip('should handle Account.create validation errors', async () => {
      const validationError = new Error('Account name cannot be empty');
      vi.spyOn(Account, 'create').mockImplementation(() => {
        throw validationError;
      });

      await expect(
        createAccountUseCase.execute(user, {
          currency,
          description: '',
          initialBalance,
          name: accountName,
          type: accountType,
          userId: user.id,
        }),
      ).rejects.toThrow('Account name cannot be empty');

      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it('should handle UUID collision gracefully', async () => {
      const expectedResult = {
        ...mockSavedAccountData,
        isTombstone: false,
      };

      mockedSaveWithIdRetry.mockResolvedValue(expectedResult);

      const mockedAccount = {} as unknown as Account;

      vi.spyOn(Account, 'create').mockReturnValue(mockedAccount);

      const result = await createAccountUseCase.execute(user, {
        currency: currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
        userId: user.id,
      });

      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        mockedAccount,
        expect.any(Function),
        expect.any(Function),
      );

      const [, repositoryMethod] = mockedSaveWithIdRetry.mock.calls[0] as [
        unknown,
        (account: Account) => Promise<unknown>,
        () => Account,
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
