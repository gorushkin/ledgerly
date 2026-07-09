import { AccountTypeValue, CurrencyCode } from '@ledgerly/shared/types';
import { AccountMapper } from 'src/application/mappers';
import { createUser } from 'src/db/createTestUser';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/';
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
  const accountId = Id.fromPersistence(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset' as AccountTypeValue;

  const mockSavedAccountData = {
    createdAt: Timestamp.create().valueOf(),
    currency,
    currentClearedBalanceLocal: initialBalance,
    description,
    id: accountId,
    initialBalance,
    isSystem: false,
    isTombstone: false,
    name: accountName,
    type: accountType,
    updatedAt: Timestamp.create().valueOf(),
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

      expect(result).toEqual([
        AccountMapper.toResponseDTO(
          AccountMapper.toDomain(mockSavedAccountData),
        ),
      ]);
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should return empty array when user has no accounts
    // - should handle repository errors properly
  });
});
