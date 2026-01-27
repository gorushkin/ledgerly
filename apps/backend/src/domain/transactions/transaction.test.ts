import { CurrencyCode, IsoDateString, UUID } from '@ledgerly/shared/types';
import { CreateEntryRequestDTO } from 'src/application';
import { CreateTransactionRequestDTO } from 'src/application/dto/transaction.dto';
import { EntryContext } from 'src/application/services/EntriesService/entries.updater';
import { createUser } from 'src/db/createTestUser';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Account, AccountType } from '../accounts';
import { Amount, Currency, DateValue, Name } from '../domain-core';
import { Entry } from '../entries';
import { User } from '../users/user.entity';

import { Transaction } from './transaction.entity';

describe('Transaction Domain Entity', () => {
  let user: User;
  let entryContext: EntryContext;
  let entries: CreateEntryRequestDTO[];
  let transactionDTO: CreateTransactionRequestDTO;

  const transactionData = {
    description: 'Test transaction',
    postingDate: '2024-01-01' as IsoDateString,
    transactionDate: '2024-01-01' as IsoDateString,
    userId: '123e4567-e89b-12d3-a456-426614174000',
  };

  const postingDate = DateValue.restore(transactionData.postingDate);
  const transactionDate = DateValue.restore(transactionData.transactionDate);

  beforeAll(async () => {
    user = await createUser();

    const usdAccount = Account.create(
      user,
      Name.create('USD Account'),
      'USD',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    const eurAccount = Account.create(
      user,
      Name.create('EUR Account'),
      'EUR',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('asset'),
    );

    const usdSystemAccount = Account.create(
      user,
      Name.create('USD System Account'),
      'System account for USD exchanges',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('liability'),
    );

    const eurSystemAccount = Account.create(
      user,
      Name.create('EUR System Account'),
      'System account for EUR exchanges',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('liability'),
    );

    entryContext = {
      accountsMap: new Map<UUID, Account>([
        [usdAccount.getId().valueOf(), usdAccount],
        [eurAccount.getId().valueOf(), eurAccount],
      ]),
      systemAccountsMap: new Map<CurrencyCode, Account>([
        [usdSystemAccount.getCurrency().valueOf(), usdSystemAccount],
        [eurSystemAccount.getCurrency().valueOf(), eurSystemAccount],
      ]),
    };

    entries = [
      {
        description: 'Sample Entry',
        operations: [
          {
            accountId: usdAccount.getId().valueOf(),
            amount: Amount.create('-200').valueOf(),
            description: 'Credit operation',
          },
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('100').valueOf(),
            description: 'Debit operation',
          },
        ],
      },
    ];

    transactionDTO = {
      description: transactionData.description,
      entries,
      postingDate: postingDate.valueOf(),
      transactionDate: transactionDate.valueOf(),
    };
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Creation and Restoration', () => {
    it('should create a valid transaction with entries', () => {
      const transaction = Transaction.create(
        user,
        transactionDTO,
        entryContext,
      );

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.description).toBe(transactionData.description);
      expect(transaction.getPostingDate()).toEqual(postingDate);
      expect(transaction.getTransactionDate()).toEqual(transactionDate);
      expect(transaction.getId()).toBeDefined();
      expect(transaction.getCreatedAt()).toBeDefined();
      expect(transaction.getUpdatedAt()).toBeDefined();
      expect(transaction.isDeleted()).toBe(false);

      const transactionEntries = transaction.getEntries();

      expect(transactionEntries).toHaveLength(entries.length);

      transactionEntries.forEach((entry, index) => {
        expect(entry).toBeInstanceOf(Entry);
        expect(entry.description).toBe(entries[index].description);
      });
    });
  });

  it('should serialize and deserialize correctly', () => {
    // TODO: fix test
    // const transaction = Transaction.create(
    //   userId,
    //   transactionData.description,
    //   postingDate,
    //   transactionDate,
    // );
    // const transactionRecord = transaction.toPersistence();
    // expect(transactionRecord).toMatchObject({
    //   description: transactionData.description,
    //   postingDate: transactionData.postingDate,
    //   transactionDate: transactionData.transactionDate,
    //   userId: transactionData.userId,
    // });
    // const restoredTransaction = Transaction.restore(transactionRecord);
    // expect(restoredTransaction.toPersistence()).toEqual(
    //   transaction.toPersistence(),
    // );
  });

  it('should update description via update method and touch updatedAt', () => {
    const transaction = Transaction.create(user, transactionDTO, entryContext);

    const originalUpdatedAt = transaction.getUpdatedAt();

    vi.advanceTimersByTime(5);

    transaction.update({ description: 'Updated description' });

    expect(transaction.description).toBe('Updated description');

    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );

    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
  });

  it('should update postingDate via update method and touch updatedAt', () => {
    const transaction = Transaction.create(user, transactionDTO, entryContext);

    const originalUpdatedAt = transaction.getUpdatedAt();
    const newPostingDate = '2024-01-15' as IsoDateString;

    vi.advanceTimersByTime(5);

    transaction.update({ postingDate: newPostingDate });

    expect(transaction.getPostingDate().valueOf()).toBe(newPostingDate);
    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );
  });

  it('should update transactionDate via update method and touch updatedAt', () => {
    const transaction = Transaction.create(user, transactionDTO, entryContext);

    const originalUpdatedAt = transaction.getUpdatedAt();
    const newTransactionDate = '2024-01-20' as IsoDateString;

    vi.advanceTimersByTime(5);

    transaction.update({ transactionDate: newTransactionDate });

    expect(transaction.getTransactionDate().valueOf()).toBe(newTransactionDate);
    expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
    expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
      originalUpdatedAt.toDate().getTime(),
    );
  });

  it('should update multiple fields at once via update method', () => {
    const transaction = Transaction.create(user, transactionDTO, entryContext);
    const newDescription = 'New description';
    const newPostingDate = '2024-02-01' as IsoDateString;
    const newTransactionDate = '2024-02-05' as IsoDateString;

    transaction.update({
      description: newDescription,
      postingDate: newPostingDate,
      transactionDate: newTransactionDate,
    });

    expect(transaction.description).toBe(newDescription);
    expect(transaction.getPostingDate().valueOf()).toBe(newPostingDate);
    expect(transaction.getTransactionDate().valueOf()).toBe(newTransactionDate);
  });

  // TODO: fix and enable these tests
  // describe('Entry Management', () => {
  //   let transaction: Transaction;

  //   beforeEach(() => {
  //     transaction = Transaction.create(userId, transactionDTO);
  //   });

  //   it.skip('should start with empty entries array', () => {
  //     expect(transaction.getEntries()).toEqual([]);
  //   });

  //   it.skip('should add entry successfully', () => {
  //     const transaction = Transaction.create(userId, transactionDTO);

  //     const mockEntry1 = {
  //       belongsToTransaction: () => true,
  //       data: 'mock entry data1',
  //     } as unknown as Entry;

  //     const mockEntry2 = {
  //       belongsToTransaction: () => true,
  //       data: 'mock entry data2',
  //     } as unknown as Entry;

  //     vi.spyOn(Entry, 'create').mockReturnValue(mockEntry1);

  //     transaction.addEntry(mockEntry1);
  //     transaction.addEntry(mockEntry2);

  //     const entries = transaction.getEntries();
  //     expect(entries).toHaveLength(2);
  //     expect(entries[0]).toBe(mockEntry1);
  //     expect(entries[1]).toBe(mockEntry2);
  //   });

  //   it.todo('should remove entry successfully', () => {
  //     // TODO: Implement when Entry.create is available
  //     // const entry = Entry.create(/* appropriate parameters */);
  //     // transaction.addEntry(entry);
  //     // transaction.removeEntry(entry.getId());
  //     // expect(transaction.getEntries()).toHaveLength(0);
  //   });

  //   it.todo('should throw error when removing non-existent entry', () => {
  //     // const nonExistentId = Id.create();
  //     // expect(() => transaction.removeEntry(nonExistentId)).toThrow('Entry not found in transaction');
  //   });

  //   it.todo('should validate entry belongs to transaction when adding', () => {
  //     // TODO: Test that entry validation works correctly
  //   });

  //   it.skip('should provide read-only access to entries', () => {
  //     const entries = transaction.getEntries();
  //     expect(entries).toBeInstanceOf(Array);

  //     // Should return a readonly array
  //     expect(transaction.getEntries()).toHaveLength(0);
  //   });

  //   it.todo('should implement balance validation', () => {
  //     // TODO: Implement isBalanced and validateBalance tests
  //   });
  // });
});
