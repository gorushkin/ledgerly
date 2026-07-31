import { AccountTypeValue, apiErrorCodes } from '@ledgerly/shared/types';
import {
  AccountHasActiveOperationsError,
  EntityNotFoundError,
} from 'src/application/application.errors';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { AccountOperationPolicy } from 'src/application/services/AccountOperationPolicy/account-operation.policy';
import { createUser } from 'src/db/createTestUser';
import { Account } from 'src/domain/accounts/account.entity';
import { AccountSnapshot } from 'src/domain/accounts/types';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { ClosedAccountOperationError } from 'src/domain/domain.errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateAccountUseCase } from '../updateAccount';

describe('UpdateAccount', async () => {
  let updateAccountUseCase: UpdateAccountUseCase;

  const user = await createUser();

  const mockAccountRepository = {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  };

  const mockAccountOperationPolicy = {
    assertNoActiveOperations: vi.fn(),
  };

  const accountId = Id.restore(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const accountType = 'asset' as AccountTypeValue;

  const mockAccountData: AccountSnapshot = {
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

  const mockAccountUpdatedData = {
    ...mockAccountData,
    name: 'Updated Account',
  };

  beforeEach(() => {
    updateAccountUseCase = new UpdateAccountUseCase(
      mockAccountRepository as unknown as AccountRepositoryInterface,
      mockAccountOperationPolicy as unknown as AccountOperationPolicy,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockAccountOperationPolicy.assertNoActiveOperations.mockReset();
    mockAccountRepository.getById.mockReset();
    mockAccountRepository.update.mockReset();
  });

  describe('execute', () => {
    it('should update account', async () => {
      vi.useFakeTimers();
      const updatedAt = Timestamp.restore('2025-01-01T00:00:01.000Z').valueOf();

      mockAccountRepository.getById.mockResolvedValue(mockAccountData);
      mockAccountRepository.update.mockResolvedValue(mockAccountUpdatedData);

      vi.setSystemTime(new Date(updatedAt));

      const result = await updateAccountUseCase.execute(user, accountId, {
        name: 'Updated Account',
      });

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(mockAccountRepository.update).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
        expect.objectContaining({ name: 'Updated Account' }),
      );

      expect(result.name).toBe('Updated Account');
      expect(result).toEqual(
        AccountMapper.toResponseDTOFromSnapshot({
          ...mockAccountUpdatedData,
          updatedAt,
        }),
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
        user.getId().valueOf(),
        accountId,
      );
      expect(mockAccountRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when account type is changed and there are active operations', async () => {
      mockAccountRepository.getById.mockResolvedValue(mockAccountData);

      mockAccountOperationPolicy.assertNoActiveOperations.mockRejectedValue(
        new AccountHasActiveOperationsError(accountId),
      );

      const result = updateAccountUseCase.execute(user, accountId, {
        type: 'liability' as AccountTypeValue,
      });

      await expect(result).rejects.toThrow(AccountHasActiveOperationsError);

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).toHaveBeenCalledWith(user.getId().valueOf(), accountId);
      expect(mockAccountRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when account type is changed and account is closed', async () => {
      mockAccountRepository.getById.mockResolvedValue({
        ...mockAccountData,
        isClosed: true,
      });

      const result = updateAccountUseCase.execute(user, accountId, {
        type: 'liability' as AccountTypeValue,
      });

      await expect(result).rejects.toThrow(ClosedAccountOperationError);
      await expect(result).rejects.toMatchObject({
        code: apiErrorCodes.closedAccountOperation,
        context: {
          accountId,
          operation: 'update',
        },
      });

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).not.toHaveBeenCalled();

      expect(mockAccountRepository.update).not.toHaveBeenCalled();
    });

    it('should call assertNoActiveOperations when account type is changed', async () => {
      mockAccountRepository.getById.mockResolvedValue(mockAccountData);

      await updateAccountUseCase.execute(user, accountId, {
        type: 'liability' as AccountTypeValue,
      });

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).toHaveBeenCalledWith(user.getId().valueOf(), accountId);
    });

    it('should not call assertNoActiveOperations when account type is not changed', async () => {
      mockAccountRepository.getById.mockResolvedValue(mockAccountData);

      await updateAccountUseCase.execute(user, accountId, {
        name: 'Updated Account',
      });

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).not.toHaveBeenCalled();
    });

    // TODO: Add missing tests based on account.service.test.ts:
    // - should throw error when user does not exist
    // - should throw error when account does not exist
    // - should throw error when account does not belong to user
    // - should validate and update different fields (name, description, type, commodityId)
    // - should handle Account domain validation errors
    // - should handle repository errors properly
  });
});
