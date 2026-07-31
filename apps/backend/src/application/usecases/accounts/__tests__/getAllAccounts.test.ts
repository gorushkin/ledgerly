import { AccountTypeValue } from '@ledgerly/shared/types';
import { AccountQuery } from '@ledgerly/shared/validation';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { createUser } from 'src/db/createTestUser';
import { AccountSnapshot } from 'src/domain/accounts';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetAllAccountsUseCase } from '../getAllAccounts';

describe('GetAllAccounts', async () => {
  let getAllAccounts: GetAllAccountsUseCase;

  let mockAccountRepository: {
    getAll: ReturnType<typeof vi.fn>;
  };

  const user = await createUser();

  const accountName = 'Test Account';

  const description = 'Test account description';
  const accountId = Id.restore(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();
  const initialBalance = Amount.create('1000').valueOf();
  const accountType = 'asset' as AccountTypeValue;

  const mockSavedAccountData: AccountSnapshot = {
    commodityId: Id.create().valueOf(),
    createdAt: Timestamp.create().valueOf(),
    currentClearedBalanceLocal: initialBalance,
    description,
    id: accountId,
    initialBalance,
    isClosed: false,
    isSystem: false,
    isTombstone: false,
    name: accountName,
    type: accountType,
    updatedAt: Timestamp.create().valueOf(),
    userId: user.getId().valueOf(),
  };

  beforeEach(() => {
    mockAccountRepository = {
      getAll: vi.fn(),
    };

    getAllAccounts = new GetAllAccountsUseCase(
      mockAccountRepository as unknown as AccountRepositoryInterface,
    );
  });

  describe('execute', () => {
    it('should return accounts for the user', async () => {
      mockAccountRepository.getAll.mockResolvedValue([mockSavedAccountData]);

      const query: AccountQuery = { status: 'all' };

      const result = await getAllAccounts.execute(user, query);

      expect(mockAccountRepository.getAll).toHaveBeenCalledWith(
        user.getId().valueOf(),
        query,
      );

      expect(result).toEqual([
        AccountMapper.toResponseDTOFromSnapshot(mockSavedAccountData),
      ]);
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should return empty array when user has no accounts
    // - should handle repository errors properly
  });
});
