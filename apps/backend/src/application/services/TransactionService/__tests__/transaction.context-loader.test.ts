import { OperationRequestDTO } from 'src/application/dto';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { createAccount } from 'src/db/createTestUser';
import { Account, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core';
import { DeletedEntityOperationError } from 'src/domain/domain.errors';
import { createUser } from 'src/testing';
import { beforeAll, describe, expect, it, vi, beforeEach } from 'vitest';

import { TransactionContextLoader } from '..';

describe('TransactionContextLoader', () => {
  let user: User;

  const mockAccountRepository = {
    getByIds: vi.fn(),
  };

  const transactionContextLoader = new TransactionContextLoader(
    mockAccountRepository as unknown as AccountRepositoryInterface,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct context for transaction', async () => {
    const account1 = createAccount(user);
    const account2 = createAccount(user);
    const account3 = createAccount(user);
    const account4 = createAccount(user);

    const accounts = [account1, account2, account3, account4];

    const rawOperations: OperationRequestDTO[] = [
      {
        accountId: account1.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1.1',
        value: Amount.create('100').valueOf(),
      },
      {
        accountId: account2.getId().valueOf(),
        amount: Amount.create('-100').valueOf(),
        description: 'Operation 1.2',
        value: Amount.create('-100').valueOf(),
      },
      {
        accountId: account3.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 2.1',
        value: Amount.create('100').valueOf(),
      },
      {
        accountId: account4.getId().valueOf(),
        amount: Amount.create('-100').valueOf(),
        description: 'Operation 2.2',
        value: Amount.create('-100').valueOf(),
      },
    ];

    mockAccountRepository.getByIds.mockResolvedValueOnce(
      accounts.map((acc) => acc.toSnapshot()),
    );

    const { accountsMap } = await transactionContextLoader.loadContext(
      user,
      rawOperations,
    );

    expect(mockAccountRepository.getByIds).toHaveBeenCalledWith(
      user.getId().valueOf(),
      accounts.map((acc) => acc.getId().valueOf()),
    );

    expect(accountsMap.size).toBe(accounts.length);

    accounts.forEach((acc) => {
      expect(accountsMap.get(acc.getId().valueOf())).toEqual(acc);
    });
  });

  it('should deduplicate account IDs when same account appears in multiple operations', async () => {
    const account = createAccount(user);

    const rawOperations: OperationRequestDTO[] = [
      {
        accountId: account.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Op 1',
        value: Amount.create('100').valueOf(),
      },
      {
        accountId: account.getId().valueOf(),
        amount: Amount.create('-100').valueOf(),
        description: 'Op 2',
        value: Amount.create('-100').valueOf(),
      },
    ];

    mockAccountRepository.getByIds.mockResolvedValueOnce([
      account.toSnapshot(),
    ]);

    await transactionContextLoader.loadContext(user, rawOperations);

    // Один аккаунт — один вызов с одним ID, без дубликатов
    expect(mockAccountRepository.getByIds).toHaveBeenCalledWith(
      user.getId().valueOf(),
      [account.getId().valueOf()],
    );
  });

  it('should propagate not found errors for accounts outside the user scope', async () => {
    const otherUser = await createUser();
    const otherUserAccount = createAccount(otherUser);
    const repositoryError = new Error('Accounts not found');

    const rawOperations: OperationRequestDTO[] = [
      {
        accountId: otherUserAccount.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Op 1',
        value: Amount.create('100').valueOf(),
      },
      {
        accountId: otherUserAccount.getId().valueOf(),
        amount: Amount.create('-100').valueOf(),
        description: 'Op 2',
        value: Amount.create('-100').valueOf(),
      },
    ];

    mockAccountRepository.getByIds.mockRejectedValueOnce(repositoryError);

    await expect(
      transactionContextLoader.loadContext(user, rawOperations),
    ).rejects.toBe(repositoryError);

    expect(mockAccountRepository.getByIds).toHaveBeenCalledWith(
      user.getId().valueOf(),
      [otherUserAccount.getId().valueOf()],
    );
  });

  it('should throw a domain error when an account is tombstoned', async () => {
    const account = createAccount(user);
    const accountSnapshot = {
      ...account.toSnapshot(),
      isTombstone: true,
    };

    const rawOperations: OperationRequestDTO[] = [
      {
        accountId: account.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Op 1',
        value: Amount.create('100').valueOf(),
      },
      {
        accountId: account.getId().valueOf(),
        amount: Amount.create('-100').valueOf(),
        description: 'Op 2',
        value: Amount.create('-100').valueOf(),
      },
    ];

    mockAccountRepository.getByIds.mockResolvedValueOnce([accountSnapshot]);

    await expect(
      transactionContextLoader.loadContext(user, rawOperations),
    ).rejects.toThrowError(
      new DeletedEntityOperationError(Account.entityType, 'use'),
    );
  });

  it('should throw a domain error when an account is closed', async () => {
    const account = createAccount(user);
    const accountSnapshot = {
      ...account.toSnapshot(),
      isClosed: true,
    };

    const rawOperations: OperationRequestDTO[] = [
      {
        accountId: account.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Op 1',
        value: Amount.create('100').valueOf(),
      },
      {
        accountId: account.getId().valueOf(),
        amount: Amount.create('-100').valueOf(),
        description: 'Op 2',
        value: Amount.create('-100').valueOf(),
      },
    ];

    mockAccountRepository.getByIds.mockResolvedValueOnce([accountSnapshot]);

    await expect(
      transactionContextLoader.loadContext(user, rawOperations),
    ).rejects.toThrowError(
      new DeletedEntityOperationError(Account.entityType, 'use'),
    );
  });

  it('should return empty maps when operations list is empty', async () => {
    mockAccountRepository.getByIds.mockResolvedValueOnce([]);

    const { accountsMap } = await transactionContextLoader.loadContext(
      user,
      [],
    );

    expect(accountsMap.size).toBe(0);
  });
});
