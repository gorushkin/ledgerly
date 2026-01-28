import {
  CurrencyCode,
  UUID,
} from 'node_modules/@ledgerly/shared/src/types/types';
import {
  CreateEntryRequestDTO,
  CreateTransactionRequestDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { EntryContext } from 'src/application/services/EntriesService/entries.updater';
import { TransactionContextLoader } from 'src/application/services/TransactionService';
import { createUser } from 'src/db/createTestUser';
import { Account, User, AccountType, Transaction } from 'src/domain';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTransactionUseCase } from '../CreateTransaction';

describe('CreateTransactionUseCase', () => {
  let user: User;

  const mockTransactionRepository = {
    save: vi.fn(),
  };

  const transactionManager = {
    run: vi.fn((cb: () => unknown) => cb()),
  };

  const transactionContextLoader = {
    loadContext: vi.fn(),
  };

  const createTransactionUseCase = new CreateTransactionUseCase(
    transactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    transactionContextLoader as unknown as TransactionContextLoader,
  );

  const postingDate = DateValue.restore('2024-01-01').valueOf();
  const transactionDate = DateValue.restore('2024-01-02').valueOf();
  const description = 'Test Transaction';

  let entries: CreateEntryRequestDTO[];

  let entryContext: EntryContext;

  beforeEach(async () => {
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
      AccountType.create('currencyTrading'),
    );

    const eurSystemAccount = Account.create(
      user,
      Name.create('EUR System Account'),
      'System account for EUR exchanges',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('currencyTrading'),
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
  });

  describe('execute', () => {
    it('should create a new transaction with entries successfully', async () => {
      const transactionDTO: CreateTransactionRequestDTO = {
        description,
        entries,
        postingDate,
        transactionDate,
      };

      transactionContextLoader.loadContext.mockResolvedValue(entryContext);

      const data: CreateTransactionRequestDTO = {
        description,
        entries,
        postingDate,
        transactionDate,
      };

      const result = await createTransactionUseCase.execute(user, data);

      expect(result.postingDate).toBe(postingDate);
      expect(result.transactionDate).toBe(transactionDate);
      expect(result.entries).toBeDefined();

      transactionDTO.entries.forEach((entry, index) => {
        const matchedEntry = result.entries[index];
        expect(matchedEntry).toBeDefined();
        expect(matchedEntry.description).toBe(entry.description);
        entry.operations.forEach((operation, opIndex) => {
          const matchedOperation = matchedEntry.operations[opIndex];
          expect(matchedOperation.accountId).toBe(operation.accountId);
          expect(matchedOperation.amount).toBe(operation.amount);
          expect(matchedOperation.description).toBe(operation.description);
        });
      });

      expect(transactionManager.run).toHaveBeenCalled();

      expect(mockTransactionRepository.save).toHaveBeenCalled();

      const savedTransaction = mockTransactionRepository.save.mock
        .calls[0][1] as unknown as Transaction;

      const savedUserId = mockTransactionRepository.save.mock
        .calls[0][0] as unknown as User;

      expect(savedUserId).toBe(user.getId().valueOf());

      expect(savedTransaction.getPostingDate().valueOf()).toBe(postingDate);
      expect(savedTransaction.getTransactionDate().valueOf()).toBe(
        transactionDate,
      );
      expect(savedTransaction.getEntries().length).toBe(
        transactionDTO.entries.length,
      );

      expect(savedTransaction.description).toBe(description);

      savedTransaction.getEntries().forEach((entry, index) => {
        const dtoEntry = transactionDTO.entries[index];
        expect(entry.description).toBe(dtoEntry.description);

        dtoEntry.operations.forEach((op, opIndex) => {
          const operation = entry.getOperations()[opIndex];
          expect(operation.getAccountId().valueOf()).toBe(op.accountId);
          expect(operation.amount.valueOf()).toBe(op.amount);
          expect(operation.description).toBe(op.description);
        });
      });

      expect(transactionContextLoader.loadContext).toHaveBeenCalledWith(
        user,
        transactionDTO.entries,
      );
    });
  });
});
