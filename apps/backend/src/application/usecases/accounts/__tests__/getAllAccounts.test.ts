import { CurrencyCode, Money } from '@ledgerly/shared/types';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetAllAccountsUseCase } from '../usecase/getAllAccounts';

describe('GetAllAccounts', () => {
  let getAllAccounts: GetAllAccountsUseCase;

  let mockAccountRepository: {
    getAll: ReturnType<typeof vi.fn>;
  };

  let mockUserRepository: { getUserById: ReturnType<typeof vi.fn> };

  const userId = Id.restore('550e8400-e29b-41d4-a716-446655440000').valueOf();

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
    id: '550e8400-e29b-41d4-a716-446655440001',
    initialBalance,
    name: accountName,
    type: accountType,
    updatedAt: new Date().toISOString(),
    userId,
  };

  beforeEach(() => {
    mockAccountRepository = {
      getAll: vi.fn(),
    };

    mockUserRepository = {
      getUserById: vi.fn(),
    };

    getAllAccounts = new GetAllAccountsUseCase(
      mockAccountRepository as unknown as AccountRepository,
      mockUserRepository as unknown as UsersRepository,
    );
  });

  describe('execute', () => {
    it('should return accounts for the user', async () => {
      mockUserRepository.getUserById.mockResolvedValue(mockUser);
      mockAccountRepository.getAll.mockResolvedValue([mockSavedAccountData]);

      const result = await getAllAccounts.execute(userId);

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(userId);
      expect(mockAccountRepository.getAll).toHaveBeenCalledWith(userId);

      expect(result).toEqual([mockSavedAccountData]);
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should return empty array when user has no accounts
    // - should handle repository errors properly
  });
});
