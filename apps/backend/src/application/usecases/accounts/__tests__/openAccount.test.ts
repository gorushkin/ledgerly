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
import { Amount, Timestamp } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenAccountUseCase } from '../openAccount';

describe('OpenAccountUseCase', async () => {
  let openAccountUseCase: OpenAccountUseCase;

  const user = await createUser();

  const mockAccountRepository = {
    getById: vi.fn(),
    open: vi.fn(),
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
    isClosed: true,
    isSystem: false,
    isTombstone: false,
    name: accountName,
    type: accountType,
    updatedAt: Timestamp.create().valueOf(),
    userId: user.getId().valueOf(),
  };

  beforeEach(() => {
    mockAccountRepository.open.mockReset();
    mockAccountRepository.getById.mockReset();

    mockUserRepository.getById.mockReset();
    mockTransactionManager.run.mockReset();
    mockTransactionManager.run.mockImplementation(runTransaction);

    openAccountUseCase = new OpenAccountUseCase(
      mockAccountRepository as unknown as AccountRepositoryInterface,
      mockTransactionManager as unknown as TransactionManagerInterface,
    );
  });

  describe('execute', () => {
    it('should open the account', async () => {
      vi.useFakeTimers();

      const updatedAt = Timestamp.restore('2025-01-01T00:00:01.000Z').valueOf();

      mockUserRepository.getById.mockResolvedValue(mockUser);

      mockAccountRepository.getById.mockResolvedValue(mockAccountData);

      vi.setSystemTime(new Date(updatedAt));

      const result = await openAccountUseCase.execute(user, accountId);

      const { updatedAt: _updatedAt, ...expectedAccountData } = mockAccountData;

      expect(mockAccountRepository.open).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
        expect.objectContaining({
          ...expectedAccountData,
          isClosed: false,
        }),
      );
      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);

      expect(result).toEqual(
        AccountMapper.toResponseDTOFromSnapshot({
          ...mockAccountData,
          isClosed: false,
          updatedAt,
        }),
      );
    });

    it('should throw when account does not exist', async () => {
      mockAccountRepository.getById.mockResolvedValue(null);

      await expect(openAccountUseCase.execute(user, accountId)).rejects.toThrow(
        EntityNotFoundError,
      );

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );
      expect(mockAccountRepository.open).not.toHaveBeenCalled();
    });

    it('should throw when account does not belong to user', async () => {
      const anotherUser = await createUser();

      mockAccountRepository.getById.mockResolvedValue(mockAccountData);

      await expect(
        openAccountUseCase.execute(anotherUser, accountId),
      ).rejects.toThrowError(UnauthorizedAccessError);

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        anotherUser.getId().valueOf(),
        accountId,
      );

      expect(mockAccountRepository.open).not.toHaveBeenCalled();
    });

    it('should not call repo saving when account is already open', async () => {
      mockAccountRepository.getById.mockResolvedValue({
        ...mockAccountData,
        isClosed: false,
      });

      const result = await openAccountUseCase.execute(user, accountId);

      expect(mockAccountRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        accountId,
      );

      expect(mockAccountRepository.open).not.toHaveBeenCalled();

      expect(result).toEqual(
        AccountMapper.toResponseDTOFromSnapshot({
          ...mockAccountData,
          isClosed: false,
        }),
      );
    });
  });
});
