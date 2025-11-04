import { CurrencyCode } from '@ledgerly/shared/types';
import { AccountRepositoryInterface } from 'src/application/interfaces';
import { createUser } from 'src/db/createTestUser';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountFactory } from '../account.factory';

describe('CreateAccountUseCase', async () => {
  const user = await createUser();

  let accountFactory: AccountFactory;
  let mockAccountRepository: { create: ReturnType<typeof vi.fn> };
  let mockedSaveWithIdRetry: ReturnType<typeof vi.fn>;

  // const accountIdValue = '660e8400-e29b-41d4-a716-446655440001';

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset';

  beforeEach(() => {
    mockAccountRepository = {
      create: vi.fn(),
    };

    mockedSaveWithIdRetry = vi
      .fn()
      .mockResolvedValue({ name: 'mocked account' }); // Mock implementation

    accountFactory = new AccountFactory(
      mockAccountRepository as unknown as AccountRepositoryInterface,
      mockedSaveWithIdRetry,
    );
  });

  describe('execute', () => {
    it.skip('should create a new account successfully', async () => {
      // Arrange

      const mockedSaveWithIdRetryResult = {};

      const mockedAccount = {} as unknown as Account;

      vi.spyOn(Account, 'create').mockReturnValue(mockedAccount);

      mockedSaveWithIdRetry.mockResolvedValue(mockedSaveWithIdRetryResult);

      // Act
      const result = await accountFactory.createAccount(user, {
        currency: currency,
        description,
        initialBalance,
        name: accountName,
        type: accountType,
      });

      // Assert
      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        mockedAccount,
        expect.any(Function), // bound create method
        expect.any(Function), // entityFactory function
      );
      expect(result).toEqual(mockedSaveWithIdRetryResult);
    });

    it.skip('should handle Account.create validation errors', async () => {
      const validationError = new Error('Account name cannot be empty');
      vi.spyOn(Account, 'create').mockImplementation(() => {
        throw validationError;
      });

      await expect(
        accountFactory.createAccount(user, {
          currency,
          description: '',
          initialBalance,
          name: accountName,
          type: accountType,
        }),
      ).rejects.toThrow('Account name cannot be empty');

      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it.todo('should handle UUID collision gracefully', async () => {
      // Simulate UUID collision by making the repository throw an error
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
