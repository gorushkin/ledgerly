import { CurrencyCode } from '@ledgerly/shared/types';
import { createUser } from 'src/db/createTestUser';
import { Amount } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteAccountUseCase } from '../deleteAccount';

describe('DeleteAccountUseCase', async () => {
  let deleteAccountUseCase: DeleteAccountUseCase;

  const user = await createUser();

  let mockAccountRepository: {
    delete: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };

  let mockUserRepository: { getById: ReturnType<typeof vi.fn> };

  const accountId = Id.fromPersistence(
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
    id: user.id,
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
    userId: user.id,
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
      getById: vi.fn(),
    };

    deleteAccountUseCase = new DeleteAccountUseCase(
      mockAccountRepository as unknown as AccountRepository,
    );
  });

  describe('execute', () => {
    it('should mark account as archived', async () => {
      mockUserRepository.getById.mockResolvedValue(mockUser);
      mockAccountRepository.getById.mockResolvedValue(mockAccountData);
      mockAccountRepository.delete.mockResolvedValue(mockSavedAccountData);

      const result = await deleteAccountUseCase.execute(user, accountId);

      expect(mockAccountRepository.delete).toHaveBeenCalledWith(
        user.id,
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
