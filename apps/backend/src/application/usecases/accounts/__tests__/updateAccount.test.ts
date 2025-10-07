import { CurrencyCode } from '@ledgerly/shared/types';
import { Amount } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { DataBase } from 'src/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateAccountUseCase } from '../updateAccount';

describe('UpdateAccount', () => {
  let updateAccountUseCase: UpdateAccountUseCase;
  let mockAccountRepository: {
    create: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockUserRepository: { getUserById: ReturnType<typeof vi.fn> };

  const userId = Id.restore('550e8400-e29b-41d4-a716-446655440000').valueOf();
  const accountId = Id.restore(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();
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

  const mockAccountData = {
    createdAt: new Date().toISOString(),
    currency,
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

  const mockAccountUpdatedData = {
    ...mockAccountData,
    name: 'Updated Account',
  };

  const tx = {} as DataBase;

  beforeEach(() => {
    mockAccountRepository = {
      create: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
    };

    mockUserRepository = {
      getUserById: vi.fn(),
    };

    updateAccountUseCase = new UpdateAccountUseCase(
      mockAccountRepository as unknown as AccountRepository,
      mockUserRepository as unknown as UsersRepository,
    );
  });

  describe('execute', () => {
    it('should update account', async () => {
      mockUserRepository.getUserById.mockResolvedValue(mockUser);
      mockAccountRepository.getById.mockResolvedValue(mockAccountData);
      mockAccountRepository.update.mockResolvedValue(mockAccountUpdatedData);

      const result = await updateAccountUseCase.execute(userId, accountId, {
        name: 'Updated Account',
      });

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(
        userId,
        undefined,
      );

      expect(mockAccountRepository.update).toHaveBeenCalledWith(
        userId,
        accountId,
        {
          ...mockAccountData,
          name: 'Updated Account',
        },
      );

      expect(result.name).toBe('Updated Account');
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should throw error when account does not exist
    // - should throw error when account does not belong to user
    // - should validate and update different fields (name, description, type, originalCurrency)
    // - should handle Account domain validation errors
    // - should handle repository errors properly
  });
});
