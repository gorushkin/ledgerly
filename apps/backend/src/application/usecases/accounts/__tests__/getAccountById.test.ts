import {
  AccountTypeValue,
  apiErrorCodes,
  CurrencyCode,
} from '@ledgerly/shared/types';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import { AccountMapper } from 'src/application/mappers';
import { createUser } from 'src/db/createTestUser';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/';
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

  const accountId = Id.fromPersistence(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();
  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset' as AccountTypeValue;

  const mockUser = {
    createdAt: Timestamp.create().valueOf(),
    email: 'test@example.com',
    id: user.id,
    name: 'Test User',
  };

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
      create: vi.fn(),
      getById: vi.fn(),
    };

    mockUserRepository = {
      getById: vi.fn(),
    };

    getAccountByIdUseCase = new GetAccountByIdUseCase(
      mockAccountRepository as unknown as AccountRepository,
    );
  });

  describe('execute', () => {
    it('should return the account when it exists and is owned by the user', async () => {
      mockUserRepository.getById.mockResolvedValue(mockUser);
      mockAccountRepository.getById.mockResolvedValue(mockSavedAccountData);

      const result = await getAccountByIdUseCase.execute(user, accountId);

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.id,
        accountId,
      );
      expect(result).toEqual(
        AccountMapper.toResponseDTO(
          AccountMapper.toDomain(mockSavedAccountData),
        ),
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
