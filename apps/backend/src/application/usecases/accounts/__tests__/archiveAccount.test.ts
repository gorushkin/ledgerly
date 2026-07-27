import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { createUser } from 'src/db/createTestUser';
import { AccountSnapshot } from 'src/domain/accounts';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArchiveAccountUseCase } from '../archiveAccount';

describe('ArchiveAccountUseCase', async () => {
  let archiveAccountUseCase: ArchiveAccountUseCase;

  const user = await createUser();

  let mockAccountRepository: {
    getById: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
  };

  let mockUserRepository: { getById: ReturnType<typeof vi.fn> };

  const accountId = Id.restore(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const accountType = 'asset';

  const mockUser = {
    createdAt: new Date().toISOString(),
    email: 'test@example.com',
    id: user.getId().valueOf(),
    name: 'Test User',
  };

  const mockAccountData: AccountSnapshot = {
    commodityId: Id.create().valueOf(),
    createdAt: Timestamp.create().valueOf(),
    currentClearedBalanceLocal: initialBalance,
    description,
    id: Id.create().valueOf(),
    initialBalance,
    isSystem: false,
    isTombstone: false,
    name: accountName,
    type: accountType,
    updatedAt: Timestamp.create().valueOf(),
    userId: user.getId().valueOf(),
  };

  const mockSavedAccountData = {
    ...mockAccountData,
    isTombstone: true,
  };

  beforeEach(() => {
    mockAccountRepository = {
      getById: vi.fn(),
      softDelete: vi.fn(),
    };

    mockUserRepository = {
      getById: vi.fn(),
    };

    archiveAccountUseCase = new ArchiveAccountUseCase(
      mockAccountRepository as unknown as AccountRepositoryInterface,
    );
  });

  describe('execute', () => {
    it('should mark account as archived', async () => {
      mockUserRepository.getById.mockResolvedValue(mockUser);
      mockAccountRepository.getById.mockResolvedValue(mockAccountData);
      mockAccountRepository.softDelete.mockResolvedValue(mockSavedAccountData);

      const result = await archiveAccountUseCase.execute(user, accountId);
      const { updatedAt: _updatedAt, ...expectedAccountData } = mockAccountData;

      expect(mockAccountRepository.softDelete).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
        expect.objectContaining({
          ...expectedAccountData,
          isTombstone: true,
        }),
      );

      expect(result).toEqual(
        AccountMapper.toResponseDTOFromSnapshot(mockSavedAccountData),
      );
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
