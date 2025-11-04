import { EntryOperations } from 'src/application/dto';
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
    getById: ReturnType<typeof vi.fn>;
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
      getById: vi.fn(),
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

  it.skip('should create operations for entry', async () => {
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

    const operationsRaw: EntryOperations = { from, to };

    mockAccountRepository.getById = vi
      .fn()
      .mockResolvedValueOnce(usdAccount1.toPersistence())
      .mockResolvedValueOnce(usdAccount2.toPersistence());

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

    const operations = await operationFactory.createOperationsForEntry(
      user,
      entry,
      operationsRaw,
    );

    expect(mockAccountRepository.getById).toHaveBeenCalledTimes(
      Object.keys(operationsRaw).length,
    );

    expect(mockAccountRepository.getById).toHaveBeenNthCalledWith(
      1,
      user.getId().valueOf(),
      operationsRaw.from.accountId,
    );

    expect(mockAccountRepository.getById).toHaveBeenNthCalledWith(
      2,
      user.getId().valueOf(),
      operationsRaw.to.accountId,
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

  it.skip('should throw an error if account not found', async () => {
    mockAccountRepository.getById = vi.fn().mockResolvedValue(null);

    const operationsRaw: EntryOperations = {
      from: {
        accountId: usdAccount1.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
      to: {
        accountId: usdAccount2.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
    };

    await expect(
      operationFactory.createOperationsForEntry(user, entry, operationsRaw),
    ).rejects.toThrowError(
      `Account not found: ${operationsRaw.from.accountId}`,
    );
  });

  it.skip('should create trading operations if accounts have different currencies', async () => {
    const fromAmount = Amount.create('-50');
    const toAmount = Amount.create('100');

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

    const operationsRaw: EntryOperations = {
      from: {
        ...testData.from.operation,
        amount: testData.from.amount.valueOf(),
      },
      to: {
        ...testData.to.operation,
        amount: testData.to.amount.valueOf(),
      },
    };

    accountFactory.createAccount = vi
      .fn()
      .mockReturnValueOnce(testData.from.systemAccount)
      .mockReturnValueOnce(testData.to.systemAccount);

    mockAccountRepository.getById = vi
      .fn()
      .mockResolvedValueOnce(testData.from.account.toPersistence())
      .mockResolvedValueOnce(testData.to.account.toPersistence())
      .mockResolvedValueOnce(testData.from.systemAccount.toPersistence())
      .mockResolvedValueOnce(testData.to.systemAccount.toPersistence());

    vi.spyOn(Account, 'restore')
      .mockReturnValueOnce(testData.from.account)
      .mockReturnValueOnce(testData.to.account);

    const operations = await operationFactory.createOperationsForEntry(
      user,
      entry,
      operationsRaw,
    );

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
    mockAccountRepository.getById = vi
      .fn()
      .mockResolvedValueOnce(usdAccount1.toPersistence())
      .mockResolvedValueOnce(usdAccount2.toPersistence());

    const operationsRaw: EntryOperations = {
      from: {
        accountId: usdAccount1.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
      to: {
        accountId: usdAccount2.getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
    };

    await expect(
      operationFactory.createOperationsForEntry(user, entry, operationsRaw),
    ).rejects.toThrowError(
      `Operations amounts are not balanced: from=${operationsRaw.from.amount.valueOf()}, to=${operationsRaw.to.amount.valueOf()}`,
    );
  });
});
