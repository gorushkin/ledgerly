import { CurrencyCode } from '@ledgerly/shared/types';
import { CreateEntryRequestDTO } from 'src/application/dto';
import { AccountRepositoryInterface } from 'src/application/interfaces/AccountRepository.interface';
import { createAccount } from 'src/db/createTestUser';
import { User } from 'src/domain';
import { Amount, Currency } from 'src/domain/domain-core';
import { createUser } from 'src/interfaces/helpers';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EntriesContextLoader } from '..';
import { AccountFactory } from '../..';

describe('EntriesContextLoader', () => {
  let user: User;

  const mockAccountRepository = {
    getByIds: vi.fn(),
  };

  const mockAccountFactory = {
    findOrCreateSystemAccount: vi.fn(),
  };

  const entriesContextLoader = new EntriesContextLoader(
    mockAccountRepository as unknown as AccountRepositoryInterface,
    mockAccountFactory as unknown as AccountFactory,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  it('should return correct context for entries', async () => {
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

    const rawEntries: CreateEntryRequestDTO[] = [
      {
        description: 'Entry 1',
        operations: [
          {
            accountId: account1.getId().valueOf(),
            amount: Amount.create('100').valueOf(),
            description: 'Operation 1.1',
          },
          {
            accountId: account2.getId().valueOf(),
            amount: Amount.create('-100').valueOf(),
            description: 'Operation 1.2',
          },
        ],
      },
      {
        description: 'Entry 2',
        operations: [
          {
            accountId: account3.getId().valueOf(),
            amount: Amount.create('100').valueOf(),
            description: 'Operation 2.1',
          },
          {
            accountId: account4.getId().valueOf(),
            amount: Amount.create('-100').valueOf(),
            description: 'Operation 2.2',
          },
        ],
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
      await entriesContextLoader.loadForEntries(user, rawEntries);

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
});
