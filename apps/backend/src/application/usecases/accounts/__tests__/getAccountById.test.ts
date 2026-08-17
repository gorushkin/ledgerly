import { AccountTypeValue, apiErrorCodes } from '@ledgerly/shared/types';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { ensureOwnedSnapshot } from 'src/application/shared/ensureOwnedSnapshot';
import { createUser } from 'src/db/createTestUser';
import { Account, AccountSnapshot } from 'src/domain/accounts';
import { Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetAccountByIdUseCase } from '../getAccountById';

describe('GetAccountByIdUseCase', async () => {
  const user = await createUser();

  let getAccountByIdUseCase: GetAccountByIdUseCase;

  let mockAccountRepository: {
    create: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
  };
  let mockUserRepository: { getById: ReturnType<typeof vi.fn> };

  const accountId = Id.restore(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();
  const accountName = 'Test Account';
  const description = 'Test account description';
  const accountType = 'asset' as AccountTypeValue;

  const mockUser = {
    createdAt: Timestamp.create().valueOf(),
    email: 'test@example.com',
    id: user.getId().valueOf(),
    name: 'Test User',
  };

  const mockSavedAccountData: AccountSnapshot = {
    commodityId: Id.create().valueOf(),
    createdAt: Timestamp.create().valueOf(),
    description,
    id: accountId,
    isClosed: false,
    isTombstone: false,
    name: accountName,
    type: accountType,
    updatedAt: Timestamp.create().valueOf(),
    userId: user.getId().valueOf(),
  };

  beforeEach(() => {
    mockAccountRepository = {
      create: vi.fn(),
      getById: vi.fn(),
    };

    mockUserRepository = {
      getById: vi.fn(),
    };

    getAccountByIdUseCase = new GetAccountByIdUseCase(
      mockAccountRepository as unknown as AccountRepositoryInterface,
      ensureOwnedSnapshot,
    );
  });

  describe('execute', () => {
    it('should return the account when it exists and is owned by the user', async () => {
      mockUserRepository.getById.mockResolvedValue(mockUser);
      mockAccountRepository.getById.mockResolvedValue(mockSavedAccountData);

      const result = await getAccountByIdUseCase.execute(user, accountId);

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );
      expect(result).toEqual(
        AccountMapper.toResponseDTOFromSnapshot(mockSavedAccountData),
      );
    });

    it('returns ENTITY_NOT_FOUND when the account does not exist', async () => {
      mockAccountRepository.getById.mockResolvedValue(null);

      const result = getAccountByIdUseCase.execute(user, accountId);

      await expect(result).rejects.toThrow(EntityNotFoundError);
      await expect(result).rejects.toMatchObject({
        code: apiErrorCodes.entityNotFound,
        context: {
          entityId: accountId,
          entityType: Account.entityType,
        },
      });
    });

    it('returns UNAUTHORIZED_ACCESS when the account belongs to another user', async () => {
      mockAccountRepository.getById.mockResolvedValue({
        ...mockSavedAccountData,
        userId: Id.create().valueOf(),
      });

      const result = getAccountByIdUseCase.execute(user, accountId);

      await expect(result).rejects.toThrow(UnauthorizedAccessError);
      await expect(result).rejects.toMatchObject({
        code: apiErrorCodes.unauthorizedAccess,
        context: {
          entityId: accountId,
          entityType: Account.entityType,
        },
      });
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should throw error when account does not exist
    // - should throw error when account does not belong to user
    // - should return the correct account data
    // - should handle repository errors properly
  });
});
