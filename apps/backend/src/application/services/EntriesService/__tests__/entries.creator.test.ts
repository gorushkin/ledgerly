import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { CreateEntryRequestDTO } from 'src/application/dto';
import { EntryRepositoryInterface } from 'src/application/interfaces';
import {
  createAccount,
  createTransaction,
  createUser,
} from 'src/db/createTestUser';
import { Account, Entry, Operation, User } from 'src/domain';
import { Amount, Currency } from 'src/domain/domain-core';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { OperationFactory } from '../../operation.factory';
import { EntryCreator } from '../entries.creator';

describe('EntriesCreator', () => {
  let user: User;

  const mockOperationFactory = {
    createOperationsForEntry: vi.fn(),
  };

  const mockEntryRepository = {
    create: vi.fn(),
  };

  const entryCreator = new EntryCreator(
    mockOperationFactory as unknown as OperationFactory,
    mockEntryRepository as unknown as EntryRepositoryInterface,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  it('should create entries correctly', async () => {
    const transaction = createTransaction(user);

    const account1 = createAccount(user, { currency: Currency.create('USD') });
    const account2 = createAccount(user, { currency: Currency.create('EUR') });

    const accounts = [account1, account2];

    const entryData: CreateEntryRequestDTO = {
      description: 'Test Entry',
      operations: [
        {
          accountId: account1.getId().valueOf(),
          amount: Amount.create('100').valueOf(),
          description: 'Operation 1',
        },
        {
          accountId: account2.getId().valueOf(),
          amount: Amount.create('-100').valueOf(),
          description: 'Operation 2',
        },
      ],
    };

    const accountsMap = new Map<UUID, Account>();

    accounts.forEach((account) => {
      accountsMap.set(account.getId().valueOf(), account);
    });

    const currenciesSet = new Set<CurrencyCode>();

    for (const acc of accounts) {
      currenciesSet.add(acc.currency.valueOf());
    }

    const systemAccounts = Array.from(currenciesSet).map((currency) =>
      createAccount(user, { currency: Currency.create(currency) }),
    );

    const systemAccountsMap = new Map<CurrencyCode, Account>();

    systemAccounts.forEach((systemAccount) => {
      systemAccountsMap.set(systemAccount.currency.valueOf(), systemAccount);
    });

    let expectedEntry: Entry;

    mockOperationFactory.createOperationsForEntry.mockImplementation(
      (user: User, entry: Entry, entryData: CreateEntryRequestDTO) => {
        expectedEntry = entry;
        const operations = entryData.operations.map((opData) => {
          const account = accountsMap.get(opData.accountId as unknown as UUID)!;

          return Operation.create(
            user,
            account,
            entry,
            Amount.create(opData.amount),
            opData.description,
          );
        });

        return operations;
      },
    );

    const result = await entryCreator.createEntryWithOperations(
      user,
      transaction,
      entryData,
      accountsMap,
      systemAccountsMap,
    );

    expect(mockEntryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: entryData.description,
        transactionId: transaction.getId().valueOf(),
        userId: user.getId().valueOf(),
      }),
    );

    expect(mockOperationFactory.createOperationsForEntry).toHaveBeenCalledWith(
      user,
      expectedEntry!,
      entryData,
      accountsMap,
      systemAccountsMap,
    );

    result.getOperations().forEach((operation, index) => {
      const opData = entryData.operations[index];
      expect(operation.description).toBe(opData.description);
      expect(operation.amount.valueOf()).toBe(opData.amount);
      expect(operation.getAccountId().valueOf()).toBe(
        opData.accountId as unknown as UUID,
      );
    });
  });
});
