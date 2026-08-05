import {
  AccountHasActiveOperationsError,
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountOperationPolicy } from 'src/application/services';
import { ensureOwnedSnapshot } from 'src/application/shared/ensureOwnedSnapshot';
import { createUser } from 'src/db/createTestUser';
import { AccountSnapshot } from 'src/domain/accounts';
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteAccountUseCase } from '../deleteAccount';

describe('DeleteAccountUseCase', async () => {
  let deleteAccountUseCase: DeleteAccountUseCase;

  const user = await createUser();

  const mockAccountRepository = {
    delete: vi.fn(),
    getByIdForLifecycle: vi.fn(),
  };

  const mockAccountOperationPolicy = {
    assertNoActiveOperations: vi.fn(),
  };

  const mockTransactionManager = {
    run: vi.fn(),
  };
  const runTransaction: TransactionManagerInterface['run'] = async (callback) =>
    callback();

  const accountId = Id.restore(
    '550e8400-e29b-41d4-a716-446655440001',
  ).valueOf();

  const accountName = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const accountType = 'asset';

  const mockAccountData: AccountSnapshot = {
    commodityId: Id.create().valueOf(),
    createdAt: Timestamp.create().valueOf(),
    currentClearedBalanceLocal: initialBalance,
    description,
    id: Id.create().valueOf(),
    initialBalance,
    isClosed: false,
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
    vi.clearAllMocks();
    vi.useRealTimers();
    mockTransactionManager.run.mockImplementation(runTransaction);

    deleteAccountUseCase = new DeleteAccountUseCase(
      mockAccountRepository as unknown as AccountRepositoryInterface,
      mockAccountOperationPolicy as unknown as AccountOperationPolicy,
      mockTransactionManager as unknown as TransactionManagerInterface,
      ensureOwnedSnapshot,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mockAccountOperationPolicy.assertNoActiveOperations.mockReset();
    mockAccountRepository.getByIdForLifecycle.mockReset();
    mockAccountRepository.delete.mockReset();
    mockTransactionManager.run.mockReset();
  });

  describe('execute', () => {
    it('should delete account when no active operations exist', async () => {
      vi.useFakeTimers();
      const updatedAt = Timestamp.restore('2025-01-01T00:00:01.000Z').valueOf();

      mockAccountOperationPolicy.assertNoActiveOperations.mockResolvedValue(
        false,
      );
      mockAccountRepository.getByIdForLifecycle.mockResolvedValue(
        mockAccountData,
      );
      mockAccountRepository.delete.mockResolvedValue(mockSavedAccountData);

      vi.setSystemTime(new Date(updatedAt));

      const result = await deleteAccountUseCase.execute(user, accountId);
      const { updatedAt: _updatedAt, ...expectedAccountData } = mockAccountData;

      expect(mockAccountRepository.delete).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
        expect.objectContaining({
          ...expectedAccountData,
          isTombstone: true,
        }),
      );

      expect(mockAccountRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );
      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).toHaveBeenCalledWith(user.getId().valueOf(), accountId);

      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);

      expect(result).toBeUndefined();
    });

    it('should throw when account has active operations', async () => {
      mockAccountRepository.getByIdForLifecycle.mockResolvedValue(
        mockAccountData,
      );
      mockAccountOperationPolicy.assertNoActiveOperations.mockRejectedValue(
        new AccountHasActiveOperationsError(accountId),
      );

      await expect(
        deleteAccountUseCase.execute(user, accountId),
      ).rejects.toThrow(new AccountHasActiveOperationsError(accountId));

      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).toHaveBeenCalledWith(user.getId().valueOf(), accountId);
      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);

      expect(mockAccountRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw when account does not exist', async () => {
      mockAccountRepository.getByIdForLifecycle.mockResolvedValue(null);

      await expect(
        deleteAccountUseCase.execute(user, accountId),
      ).rejects.toThrowError(EntityNotFoundError);

      expect(mockAccountRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );
      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).not.toHaveBeenCalled();

      expect(mockAccountRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw when account does not belong to user', async () => {
      const anotherUser = await createUser();

      mockAccountRepository.getByIdForLifecycle.mockResolvedValue(
        mockAccountData,
      );

      await expect(
        deleteAccountUseCase.execute(anotherUser, accountId),
      ).rejects.toThrowError(UnauthorizedAccessError);

      expect(mockAccountRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        anotherUser.getId().valueOf(),
        accountId,
      );

      expect(mockAccountRepository.delete).not.toHaveBeenCalled();
    });

    it('should not call repo saving and assertNoActiveOperations when account is already deleted', async () => {
      mockAccountRepository.getByIdForLifecycle.mockResolvedValue({
        ...mockAccountData,
        isTombstone: true,
      });

      const result = await deleteAccountUseCase.execute(user, accountId);

      expect(mockAccountRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(mockAccountRepository.delete).not.toHaveBeenCalled();

      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).not.toHaveBeenCalled();

      expect(result).toBeUndefined();
    });

    it('should keep delete idempotent when tombstoned account has stale active operations', async () => {
      mockAccountRepository.getByIdForLifecycle.mockResolvedValue({
        ...mockAccountData,
        isTombstone: true,
      });

      mockAccountOperationPolicy.assertNoActiveOperations.mockRejectedValue(
        new AccountHasActiveOperationsError(accountId),
      );

      const result = await deleteAccountUseCase.execute(user, accountId);

      expect(mockAccountRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(mockAccountRepository.delete).not.toHaveBeenCalled();
      expect(
        mockAccountOperationPolicy.assertNoActiveOperations,
      ).not.toHaveBeenCalled();

      expect(result).toBeUndefined();
    });
  });
});
