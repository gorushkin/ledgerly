import {
  AccountTypeValue,
  apiErrorCodes,
  CurrencyCode,
} from '@ledgerly/shared/types';
import { EntityNotFoundError } from 'src/application/application.errors';
import { AccountMapper } from 'src/application/mappers';
import { createUser } from 'src/db/createTestUser';
import { Account } from 'src/domain/accounts/account.entity';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { AccountRepository } from 'src/infrastructure/db/';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateAccountUseCase } from '../updateAccount';

describe('UpdateAccount', async () => {
  let updateAccountUseCase: UpdateAccountUseCase;

  const user = await createUser();

  let mockAccountRepository: {
    create: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  const accountId = Id.fromPersistence(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currency = 'USD' as CurrencyCode;
  const accountType = 'asset' as AccountTypeValue;

  const mockAccountData = {
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

  const mockAccountUpdatedData = {
    ...mockAccountData,
    name: 'Updated Account',
  };

  beforeEach(() => {
    mockAccountRepository = {
      create: vi.fn(),
      getById: vi.fn(),
      update: vi.fn(),
    };

    updateAccountUseCase = new UpdateAccountUseCase(
      mockAccountRepository as unknown as AccountRepository,
    );
  });

  describe('execute', () => {
    it('should update account', async () => {
      mockAccountRepository.getById.mockResolvedValue(mockAccountData);
      mockAccountRepository.update.mockResolvedValue(mockAccountUpdatedData);

      const result = await updateAccountUseCase.execute(user, accountId, {
        name: 'Updated Account',
      });

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.id,
        accountId,
      );

      expect(mockAccountRepository.update).toHaveBeenCalledWith(
        user.id,
        accountId,
        expect.objectContaining({ name: 'Updated Account' }),
      );

      expect(result.name).toBe('Updated Account');
      expect(result).toEqual(
        AccountMapper.toResponseDTO(
          AccountMapper.toDomain(mockAccountUpdatedData),
        ),
      );
    });

    it('should throw error when account does not exist', async () => {
      mockAccountRepository.getById.mockResolvedValue(null);

      const result = updateAccountUseCase.execute(user, accountId, {
        name: 'Updated Account',
      });

      await expect(result).rejects.toThrow(EntityNotFoundError);
      await expect(result).rejects.toMatchObject({
        code: apiErrorCodes.entityNotFound,
        context: {
          entityId: accountId,
          entityType: Account.entityType,
        },
      });

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.id,
        accountId,
      );
      expect(mockAccountRepository.update).not.toHaveBeenCalled();
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
