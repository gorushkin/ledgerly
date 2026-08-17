import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { createUser } from 'src/db/createTestUser';
import { AccountSnapshot } from 'src/domain/accounts';
import { Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CloseAccountUseCase } from '../closeAccount';

describe('CloseAccountUseCase', async () => {
  let closeAccountUseCase: CloseAccountUseCase;

  const user = await createUser();

  const mockAccountRepository = {
    close: vi.fn(),
    getById: vi.fn(),
  };

  const mockUserRepository = {
    getById: vi.fn(),
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
    description,
    id: Id.create().valueOf(),
    isClosed: false,
    isTombstone: false,
    name: accountName,
    type: accountType,
    updatedAt: Timestamp.create().valueOf(),
    userId: user.getId().valueOf(),
  };

  beforeEach(() => {
    mockAccountRepository.close.mockReset();
    mockAccountRepository.getById.mockReset();

    mockUserRepository.getById.mockReset();
    mockTransactionManager.run.mockReset();
    mockTransactionManager.run.mockImplementation(runTransaction);

    closeAccountUseCase = new CloseAccountUseCase(
      mockAccountRepository as unknown as AccountRepositoryInterface,
      mockTransactionManager as unknown as TransactionManagerInterface,
    );
  });

  describe('execute', () => {
    it('should close the account', async () => {
      vi.useFakeTimers();

      const updatedAt = Timestamp.restore('2025-01-01T00:00:01.000Z').valueOf();

      mockUserRepository.getById.mockResolvedValue(mockUser);

      mockAccountRepository.getById.mockResolvedValue(mockAccountData);

      vi.setSystemTime(new Date(updatedAt));

      const result = await closeAccountUseCase.execute(user, accountId);

      const { updatedAt: _updatedAt, ...expectedAccountData } = mockAccountData;

      expect(mockAccountRepository.close).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
        expect.objectContaining({
          ...expectedAccountData,
          isClosed: true,
        }),
      );
      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);

      expect(result).toEqual(
        AccountMapper.toResponseDTOFromSnapshot({
          ...mockAccountData,
          isClosed: true,
          updatedAt,
        }),
      );
    });

    it('should throw when account does not exist', async () => {
      mockAccountRepository.getById.mockResolvedValue(null);

      await expect(
        closeAccountUseCase.execute(user, accountId),
      ).rejects.toThrow(EntityNotFoundError);

      expect(mockAccountRepository.close).not.toHaveBeenCalled();
    });

    it('should throw when account does not belong to user', async () => {
      const anotherUser = await createUser();

      mockAccountRepository.getById.mockResolvedValue(mockAccountData);

      await expect(
        closeAccountUseCase.execute(anotherUser, accountId),
      ).rejects.toThrowError(UnauthorizedAccessError);

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        anotherUser.getId().valueOf(),
        accountId,
      );

      expect(mockAccountRepository.close).not.toHaveBeenCalled();
    });

    it('should not call  repo saving when account is already open', async () => {
      mockAccountRepository.getById.mockResolvedValue({
        ...mockAccountData,
        isClosed: true,
      });

      const result = await closeAccountUseCase.execute(user, accountId);

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(mockAccountRepository.close).not.toHaveBeenCalled();

      expect(result).toEqual(
        AccountMapper.toResponseDTOFromSnapshot({
          ...mockAccountData,
          isClosed: true,
        }),
      );
    });
  });
});
