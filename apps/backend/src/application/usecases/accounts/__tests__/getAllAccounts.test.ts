import { CurrencyCode, Money } from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetAllAccountsUseCase } from '../getAllAccounts';

import { createUser } from './createUser';

describe('GetAllAccounts', async () => {
  let getAllAccounts: GetAllAccountsUseCase;

  let mockAccountRepository: {
    getAll: ReturnType<typeof vi.fn>;
  };

  const user = await createUser();

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = 1000 as Money;
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset';

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
    userId: user.id,
  };

  beforeEach(() => {
    mockAccountRepository = {
      getAll: vi.fn(),
    };

    getAllAccounts = new GetAllAccountsUseCase(
      mockAccountRepository as unknown as AccountRepository,
    );
  });

  describe('execute', () => {
    it('should return accounts for the user', async () => {
      mockAccountRepository.getAll.mockResolvedValue([mockSavedAccountData]);

      const result = await getAllAccounts.execute(user);

      expect(mockAccountRepository.getAll).toHaveBeenCalledWith(user.id);

      expect(result).toEqual([mockSavedAccountData]);
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should return empty array when user has no accounts
    // - should handle repository errors properly
  });
});
