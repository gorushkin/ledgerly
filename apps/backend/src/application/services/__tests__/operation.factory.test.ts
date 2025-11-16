import { CurrencyCode, MoneyString } from '@ledgerly/shared/types';
import { CreateEntryRequestDTO } from 'src/application/dto';
import {
  AccountRepositoryInterface,
  OperationRepositoryInterface,
} from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import {
  createEntry,
  createTransaction,
  createUser,
} from 'src/db/createTestUser';
import { Account, Entry, Operation, User } from 'src/domain';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { describe, it, vi, beforeEach, expect, beforeAll } from 'vitest';

import { AccountFactory, OperationFactory } from '../';

describe('OperationFactory', () => {
  let user: User;
  let transaction: ReturnType<typeof createTransaction>;
  let entry: ReturnType<typeof createEntry>;

  let operationFactory: OperationFactory;

  let mockOperationRepository: {
    create: ReturnType<typeof vi.fn>;
  };

  let accountFactory: {
    createAccount: ReturnType<typeof vi.fn>;
  };

  let mockAccountRepository: {
    findSystemAccount: ReturnType<typeof vi.fn>;
  };

  let mockedSaveWithIdRetry: SaveWithIdRetryType;

  let usdAccount1: Account;
  let usdAccount2: Account;
  let usdSystemAccount: Account;
  let eurAccount: Account;
  let eurSystemAccount: Account;

  beforeAll(async () => {
    user = await createUser();

    transaction = createTransaction(user);

    entry = createEntry(user, transaction, []);

    usdAccount1 = Account.create(
      user,
      Name.create('USD Wallet'),
      'USD Wallet',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    usdAccount2 = Account.create(
      user,
      Name.create('USD card'),
      'USD card',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    eurAccount = Account.create(
      user,
      Name.create('EUR grocery'),
      'EUR grocery',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('asset'),
    );

    eurSystemAccount = Account.create(
      user,
      Name.create('Trading system account for EUR'),
      'Trading system account for EUR',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('currencyTrading'),
    );

    usdSystemAccount = Account.create(
      user,
      Name.create('Trading system account for USD'),
      'Trading system account for USD',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('currencyTrading'),
    );
  });

  beforeEach(() => {
    mockOperationRepository = {
      create: vi.fn(),
    };

    mockAccountRepository = {
      findSystemAccount: vi.fn(),
    };

    accountFactory = {
      createAccount: vi.fn(),
    };

    mockedSaveWithIdRetry = vi
      .fn()
      .mockResolvedValue({ name: 'mocked account' }) as SaveWithIdRetryType;

    operationFactory = new OperationFactory(
      mockOperationRepository as unknown as OperationRepositoryInterface,
      accountFactory as unknown as AccountFactory,
      mockAccountRepository as unknown as AccountRepositoryInterface,
      mockedSaveWithIdRetry,
    );
  });

  it('should create operations for entry', async () => {
    const fromAmount = Amount.create('-100');

    const from = {
      accountId: usdAccount1.getId().valueOf(),
      amount: fromAmount.valueOf(),
      description: 'Operation from',
    };

    const toAmount = Amount.create('100');

    const to = {
      accountId: usdAccount2.getId().valueOf(),
      amount: toAmount.valueOf(),
      description: 'Operation to',
    };

    const operationsRaw: CreateEntryRequestDTO = [from, to];

    const mockedOperationFrom = Operation.create(
      user,
      usdAccount1,
      entry,
      fromAmount,
      from.description,
    );

    const mockedOperationTo = Operation.create(
      user,
      usdAccount2,
      entry,
      toAmount,
      to.description,
    );

    const mockedOperations = [mockedOperationFrom, mockedOperationTo];

    vi.spyOn(Operation, 'create').mockReturnValueOnce(mockedOperations[0]);
    vi.spyOn(Operation, 'create').mockReturnValueOnce(mockedOperations[1]);

    // Create accountsMap for the new signature
    const accountsByIdMap = new Map([
      [usdAccount1.getId().valueOf(), usdAccount1],
      [usdAccount2.getId().valueOf(), usdAccount2],
    ]);

    const currencySystemAccountsMap = new Map([
      [Currency.create('USD').valueOf(), usdSystemAccount],
      [Currency.create('USD').valueOf(), eurSystemAccount],
    ]);

    const operations = await operationFactory.createOperationsForEntry(
      user,
      entry,
      operationsRaw,
      accountsByIdMap,
      currencySystemAccountsMap,
    );

    expect(mockedSaveWithIdRetry).toHaveBeenCalledTimes(
      Object.keys(operationsRaw).length,
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    mockedSaveWithIdRetry.mock.calls.forEach(
      (
        [entryArg, repoArg, createFn]: [
          Operation,
          typeof mockOperationRepository.create,
          () => Promise<void>,
        ],
        index: number,
      ) => {
        expect(entryArg).toBe(
          mockedOperations[index as keyof typeof mockedOperations],
        );

        expect(typeof repoArg).toBe('function');
        expect(typeof createFn).toBe('function');
      },
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    Operation.create.mock.calls.forEach(
      ([calledUser, calledAccount, entry, amount, description]: [
        User,
        Account,
        Entry,
        Amount,
        string,
      ]) => {
        const operation = operations.find(
          (op) => op.description === description,
        );

        const account = [usdAccount1, usdAccount2].find((acc) =>
          operation?.belongsToAccount(acc),
        );

        expect(operation).toBeDefined();
        expect(account).toBeDefined();

        expect(calledUser).toBe(user);
        expect(account).toEqual(calledAccount);
        expect(account).toBeInstanceOf(Account);
        expect(entry).toBe(entry);
        expect(amount).toBeInstanceOf(Amount);
        expect(amount.valueOf()).toBe(operation?.amount.valueOf());
        expect(description).toBe(operation?.description);
      },
    );

    expect(operations).toHaveLength(Object.keys(operationsRaw).length);

    operations.forEach((operation, index) => {
      expect(operation).toBe(mockedOperations[index]);
    });
  });

  it('should throw an error if account not found', async () => {
    const operationsRaw: CreateEntryRequestDTO = [
      {
        accountId: usdAccount1.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
      {
        accountId: usdAccount2.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
    ];

    // Create accountsMap with missing account
    const accountsMap = new Map([
      // Only add usdAccount2, usdAccount1 is missing
      [usdAccount2.getId().valueOf(), usdAccount2],
    ]);

    const currencySystemAccountsMap = new Map([
      [Currency.create('USD').valueOf(), usdSystemAccount],
      [Currency.create('USD').valueOf(), eurSystemAccount],
    ]);

    await expect(
      operationFactory.createOperationsForEntry(
        user,
        entry,
        operationsRaw,
        accountsMap,
        currencySystemAccountsMap,
      ),
    ).rejects.toThrowError(
      `Account not found in map: ${operationsRaw[0].accountId}`,
    );
  });

  it('should create trading operations if accounts have different currencies', async () => {
    const fromAmount = Amount.create('-50');
    const fromCurrency = eurAccount.currency;
    const toAmount = Amount.create('100');
    const toCurrency = usdAccount1.currency;

    const testData = {
      from: {
        account: eurAccount,
        amount: fromAmount,
        operation: {
          accountId: eurAccount.getId().valueOf(),
          description: 'eur Operation ',
        },
        systemAccount: eurSystemAccount,
        systemAmount: fromAmount.negate(),
      },
      to: {
        account: usdAccount1,
        amount: toAmount,
        operation: {
          accountId: usdAccount1.getId().valueOf(),
          description: 'usd Operation ',
        },
        systemAccount: usdSystemAccount,
        systemAmount: toAmount.negate(),
      },
    };

    const operationsRaw: CreateEntryRequestDTO = [
      {
        ...testData.from.operation,
        amount: testData.from.amount.valueOf(),
      },
      {
        ...testData.to.operation,
        amount: testData.to.amount.valueOf(),
      },
    ];

    accountFactory.createAccount = vi
      .fn()
      .mockReturnValueOnce(testData.from.systemAccount)
      .mockReturnValueOnce(testData.to.systemAccount);

    vi.spyOn(Account, 'restore')
      .mockReturnValueOnce(testData.from.systemAccount)
      .mockReturnValueOnce(testData.to.systemAccount);

    // Create accountsMap for the new signature (only user accounts, system accounts will be fetched separately)
    const accountsMap = new Map([
      [testData.from.account.getId().valueOf(), testData.from.account],
      [testData.to.account.getId().valueOf(), testData.to.account],
    ]);

    const currencySystemAccountsMap = new Map([
      [Currency.create('USD').valueOf(), usdSystemAccount],
      [Currency.create('EUR').valueOf(), eurSystemAccount],
    ]);

    const operations = await operationFactory.createOperationsForEntry(
      user,
      entry,
      operationsRaw,
      accountsMap,
      currencySystemAccountsMap,
    );

    const expectedResultsDTO: { currency: Currency; amount: Amount }[] = [
      { amount: testData.from.amount, currency: fromCurrency },
      { amount: testData.from.amount.negate(), currency: fromCurrency },
      { amount: testData.to.amount, currency: toCurrency },
      { amount: testData.to.amount.negate(), currency: toCurrency },
    ];

    const expectedResultsMap = expectedResultsDTO.reduce((map, item) => {
      map.set(item.amount.valueOf(), item.currency.valueOf());
      return map;
    }, new Map<MoneyString, CurrencyCode>());

    operations.forEach((operation) => {
      const currencyPair = expectedResultsMap.get(operation.amount.valueOf());

      expect(currencyPair).toBeDefined();
      expect(operation.currency.valueOf()).toBe(currencyPair);
      expectedResultsMap.delete(operation.amount.valueOf());
    });

    expect(expectedResultsMap.size).toBe(0);

    expect(operations).toHaveLength(4);

    const operationsBalance = operations.reduce((acc, operation) => {
      return acc.add(operation.amount);
    }, Amount.create('0'));

    expect(operationsBalance.valueOf()).toBe('0');

    const fromSystemOperation = operations.find((op) =>
      op.belongsToAccount(testData.from.systemAccount),
    );

    expect(fromSystemOperation).toBeDefined();

    expect(fromSystemOperation?.amount.valueOf()).toBe(
      testData.from.systemAmount.valueOf(),
    );

    const toSystemOperation = operations.find((op) =>
      op.belongsToAccount(testData.to.systemAccount),
    );

    expect(toSystemOperation).toBeDefined();

    expect(toSystemOperation?.amount.valueOf()).toBe(
      testData.to.systemAmount.valueOf(),
    );
  });

  it('should throw an error if the balances of operations do not equal zero', async () => {
    const operationsRaw: CreateEntryRequestDTO = [
      {
        accountId: usdAccount1.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
      {
        accountId: usdAccount2.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
    ];

    // Create accountsMap for the new signature
    const accountsMap = new Map([
      [usdAccount1.getId().valueOf(), usdAccount1],
      [usdAccount2.getId().valueOf(), usdAccount2],
    ]);

    const currencySystemAccountsMap = new Map([
      [Currency.create('USD').valueOf(), eurSystemAccount],
    ]);

    await expect(
      operationFactory.createOperationsForEntry(
        user,
        entry,
        operationsRaw,
        accountsMap,
        currencySystemAccountsMap,
      ),
    ).rejects.toThrowError(
      `Operations amounts are not balanced: from=${operationsRaw[0].amount.valueOf()}, to=${operationsRaw[1].amount.valueOf()}`,
    );
  });
});
