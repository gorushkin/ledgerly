import { CurrencyCode } from '@ledgerly/shared/types';
import { Amount } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteAccountUseCase } from '../deleteAccount';

describe('DeleteAccountUseCase', () => {
  let deleteAccountUseCase: DeleteAccountUseCase;

  let mockAccountRepository: {
    delete: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };

  let mockUserRepository: { getUserById: ReturnType<typeof vi.fn> };

  const userId = Id.restore('550e8400-e29b-41d4-a716-446655440000').valueOf();
  const accountId = Id.restore(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currencyCode = 'USD' as CurrencyCode;
  const accountType = 'asset';

  const mockUser = {
    createdAt: new Date().toISOString(),
    email: 'test@example.com',
    id: userId,
    name: 'Test User',
  };

  const mockAccountData = {
    createdAt: new Date().toISOString(),
    currency: currencyCode,
    currentClearedBalanceLocal: initialBalance,
    description,
    id: '550e8400-e29b-41d4-a716-446655440001',
    initialBalance,
    isTombstone: false,
    name: accountName,
    type: accountType,
    updatedAt: new Date().toISOString(),
    userId,
  };

  const mockSavedAccountData = {
    ...mockAccountData,
    isTombstone: false,
  };

  beforeEach(() => {
    mockAccountRepository = {
      delete: vi.fn(),
      getById: vi.fn(),
    };

    mockUserRepository = {
      getUserById: vi.fn(),
    };

    deleteAccountUseCase = new DeleteAccountUseCase(
      mockAccountRepository as unknown as AccountRepository,
      mockUserRepository as unknown as UsersRepository,
    );
  });

  describe('execute', () => {
    it('should mark account as archived', async () => {
      mockUserRepository.getUserById.mockResolvedValue(mockUser);
      mockAccountRepository.getById.mockResolvedValue(mockAccountData);
      mockAccountRepository.delete.mockResolvedValue(mockSavedAccountData);

      const result = await deleteAccountUseCase.execute(userId, accountId);

      expect(mockAccountRepository.delete).toHaveBeenCalledWith(
        userId,
        accountId,
      );

      expect(result).toEqual(mockSavedAccountData);
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should throw error when account does not exist
    // - should throw error when account does not belong to user
    // - should verify account exists before archiving
    // - should handle repository errors properly
    // - should not allow archiving already archived accounts
  });
});
