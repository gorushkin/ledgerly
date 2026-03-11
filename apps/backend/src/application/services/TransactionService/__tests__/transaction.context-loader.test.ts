import { CurrencyCode } from '@ledgerly/shared/types';
import { OperationRequestDTO } from 'src/application/dto';
import { AccountRepositoryInterface } from 'src/application/interfaces/AccountRepository.interface';
import { createAccount } from 'src/db/createTestUser';
import { User } from 'src/domain';
import { Amount, Currency } from 'src/domain/domain-core';
import { createUser } from 'src/interfaces/helpers';
import { beforeAll, describe, expect, it, vi, beforeEach } from 'vitest';

import { TransactionContextLoader } from '..';
import { AccountFactory } from '../..';

describe('TransactionContextLoader', () => {
  let user: User;

  const mockAccountRepository = {
    getByIds: vi.fn(),
  };

  const mockAccountFactory = {
    findOrCreateSystemAccount: vi.fn(),
  };

  const transactionContextLoader = new TransactionContextLoader(
    mockAccountRepository as unknown as AccountRepositoryInterface,
    mockAccountFactory as unknown as AccountFactory,
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
    const account4 = createAccount(user, { currency: Currency.create('EUR') });

    const accounts = [account1, account2, account3, account4];

    const currenciesSet = new Set<CurrencyCode>();

    for (const acc of accounts) {
      currenciesSet.add(acc.currency.valueOf());
    }

    const systemAccounts = Array.from(currenciesSet).map((currency) =>
      createAccount(user, { currency: Currency.create(currency) }),
    );

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
      accounts.map((acc) => acc.toPersistence()),
    );

    systemAccounts.forEach((systemAccount) => {
      mockAccountFactory.findOrCreateSystemAccount.mockResolvedValueOnce(
        systemAccount,
      );
    });

    const { accountsMap, systemAccountsMap } =
      await transactionContextLoader.loadContext(user, rawOperations);

    expect(mockAccountRepository.getByIds).toHaveBeenCalledWith(
      user.getId().valueOf(),
      accounts.map((acc) => acc.getId().valueOf()),
    );

    expect(mockAccountFactory.findOrCreateSystemAccount).toHaveBeenCalledTimes(
      currenciesSet.size,
    );

    Array.from(currenciesSet).forEach((currency, index) => {
      expect(
        mockAccountFactory.findOrCreateSystemAccount,
      ).toHaveBeenNthCalledWith(index + 1, user, currency);
    });

    expect(accountsMap.size).toBe(accounts.length);

    accounts.forEach((acc) => {
      expect(accountsMap.get(acc.getId().valueOf())).toEqual(acc);
    });

    expect(systemAccountsMap.size).toBe(systemAccounts.length);

    systemAccounts.forEach((systemAccount) => {
      expect(systemAccountsMap.get(systemAccount.currency.valueOf())).toEqual(
        systemAccount,
      );
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
      account.toPersistence(),
    ]);

    mockAccountFactory.findOrCreateSystemAccount.mockResolvedValueOnce(
      createAccount(user),
    );

    await transactionContextLoader.loadContext(user, rawOperations);

    // Один аккаунт — один вызов с одним ID, без дубликатов
    expect(mockAccountRepository.getByIds).toHaveBeenCalledWith(
      user.getId().valueOf(),
      [account.getId().valueOf()],
    );
    expect(mockAccountFactory.findOrCreateSystemAccount).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should return empty maps when operations list is empty', async () => {
    mockAccountRepository.getByIds.mockResolvedValueOnce([]);

    const { accountsMap, systemAccountsMap } =
      await transactionContextLoader.loadContext(user, []);

    expect(accountsMap.size).toBe(0);
    expect(systemAccountsMap.size).toBe(0);
    expect(mockAccountFactory.findOrCreateSystemAccount).not.toHaveBeenCalled();
  });
});
