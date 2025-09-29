import { CurrencyCode, Money } from '@ledgerly/shared/types';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Account } from 'src/domain/accounts/account.entity';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountUseCase } from '../createAccount';

describe('CreateAccountUseCase', () => {
  let createAccountUseCase: CreateAccountUseCase;
  let mockAccountRepository: { create: ReturnType<typeof vi.fn> };
  let mockUserRepository: { getUserById: ReturnType<typeof vi.fn> };

  const userIdValue = '550e8400-e29b-41d4-a716-446655440000';
  const accountIdValue = '660e8400-e29b-41d4-a716-446655440001';

  const userId = Id.restore(userIdValue).valueOf();
  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = 1000 as Money;
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

    createAccountUseCase = new CreateAccountUseCase(
      mockAccountRepository as unknown as AccountRepository,
      mockUserRepository as unknown as UsersRepository,
    );
  });

  describe('execute', () => {
    it('should create a new account successfully', async () => {
      mockUserRepository.getUserById.mockResolvedValue(mockUser);
      mockAccountRepository.create.mockResolvedValue(mockSavedAccountData);

      // Mock Account.create static method
      const mockAccount = {
        toPersistence: vi.fn().mockReturnValue({
          currency,
          currentClearedBalanceLocal: initialBalance,
          description,
          id: accountIdValue,
          initialBalance,
          name: accountName,
          type: accountType,
          userId,
        }),
      };

      const spyAccountCreate = vi
        .spyOn(Account, 'create')
        .mockReturnValue(mockAccount as unknown as Account);

      const mockUserIdVO = { toString: () => userId, valueOf: () => userId };
      const mockAccountIdVO = {
        toString: () => accountIdValue,
        valueOf: () => accountIdValue,
      };

      const spyIdRestore = vi
        .spyOn(Id, 'restore')
        .mockImplementation((value: string) => {
          if (value === userId) {
            return mockUserIdVO as unknown as Id;
          }
          if (value === accountIdValue) {
            return mockAccountIdVO as unknown as Id;
          }
          return mockUserIdVO as unknown as Id; // fallback
        });

      vi.spyOn(Id, 'create').mockReturnValue(mockAccountIdVO as unknown as Id);

      const spyAccountTypeCreate = vi.spyOn(AccountType, 'create');

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
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(spyAccountCreate).toHaveBeenCalledWith(
        Id.restore(userId),
        accountName,
        description,
        initialBalance,
        currency,
        AccountType.create(accountType),
      );
      expect(spyIdRestore).toHaveBeenCalledWith(userId);
      expect(spyAccountTypeCreate).toHaveBeenCalledWith(accountType);
      expect(mockAccount.toPersistence).toHaveBeenCalled();
      expect(mockAccountRepository.create).toHaveBeenCalledWith({
        currency,
        currentClearedBalanceLocal: initialBalance,
        description,
        id: accountIdValue,
        initialBalance,
        name: accountName,
        type: accountType,
        userId,
      });

      expect(result).toEqual({
        ...mockSavedAccountData,
        isTombstone: false,
      });
    });

    it('should throw error when user does not exist', async () => {
      // Arrange
      mockUserRepository.getUserById.mockResolvedValue(null);

      // Act & Assert
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

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it('should handle Account.create validation errors', async () => {
      // Arrange
      mockUserRepository.getUserById.mockResolvedValue(mockUser);

      const validationError = new Error('Account name cannot be empty');
      vi.spyOn(Account, 'create').mockImplementation(() => {
        throw validationError;
      });

      // Act & Assert
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

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
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
