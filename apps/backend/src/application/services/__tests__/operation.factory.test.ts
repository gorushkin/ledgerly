import { CreateEntryRequestDTO } from 'src/application/dto';
import { OperationRepositoryInterface } from 'src/application/interfaces';
import {
  createEntry,
  createTransaction,
  createUser,
} from 'src/db/createTestUser';
import { Account, Operation, User, AccountType } from 'src/domain';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { UnbalancedEntryError } from 'src/domain/domain.errors';
import { describe, it, vi, expect, beforeAll } from 'vitest';

import { OperationFactory } from '../';

describe('OperationFactory', () => {
  let user: User;
  let transaction: ReturnType<typeof createTransaction>;
  let entry: ReturnType<typeof createEntry>;

  const mockOperationRepository = {
    create: vi.fn(),
  } as unknown as OperationRepositoryInterface;

  const mockedSaveWithIdRetry = vi.fn();

  const operationFactory = new OperationFactory(
    mockOperationRepository,
    mockedSaveWithIdRetry,
  );

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

  it('should create operations for entry', async () => {
    const fromAmount = Amount.create('-100');

    const operationFromDTO = {
      accountId: usdAccount1.getId().valueOf(),
      amount: fromAmount.valueOf(),
      description: 'Operation from',
    };

    const toAmount = Amount.create('100');

    const operationToDTO = {
      accountId: usdAccount2.getId().valueOf(),
      amount: toAmount.valueOf(),
      description: 'Operation to',
    };

    const entriesRaw: CreateEntryRequestDTO = {
      description: 'Test Entry',
      operations: [operationFromDTO, operationToDTO],
    };

    const mockedOperationFrom = Operation.create(
      user,
      usdAccount1,
      entry,
      fromAmount,
      operationFromDTO.description,
    );

    const mockedOperationTo = Operation.create(
      user,
      usdAccount2,
      entry,
      toAmount,
      operationToDTO.description,
    );

    const accountsByIdMap = new Map([
      [usdAccount1.getId().valueOf(), usdAccount1],
      [usdAccount2.getId().valueOf(), usdAccount2],
    ]);

    const currencySystemAccountsMap = new Map([
      [Currency.create('USD').valueOf(), usdSystemAccount],
      [Currency.create('USD').valueOf(), eurSystemAccount],
    ]);

    mockedSaveWithIdRetry
      .mockResolvedValueOnce(mockedOperationFrom)
      .mockResolvedValueOnce(mockedOperationTo);

    const operations = await operationFactory.createOperationsForEntry(
      user,
      entry,
      entriesRaw,
      accountsByIdMap,
      currencySystemAccountsMap,
    );

    expect(mockedSaveWithIdRetry).toHaveBeenCalledTimes(
      Object.keys(entriesRaw).length,
    );

    operations.forEach((operation, index) => {
      expect(operation).toBeInstanceOf(Operation);
      expect(operation.getId()).toBeDefined();
      expect(operation.belongsToUser(user.getId())).toBe(true);
      const expectedData = entriesRaw.operations[index];
      expect(operation.amount.valueOf()).toBe(expectedData.amount);
      expect(operation.description).toBe(expectedData.description);
    });

    mockedSaveWithIdRetry.mock.calls.forEach((call: unknown[]) => {
      const [repoCreateFn, createOperationFn] = call;

      expect(typeof repoCreateFn).toBe('function');
      expect(typeof createOperationFn).toBe('function');

      const operation = (createOperationFn as () => Operation)();
      expect(operation).toBeInstanceOf(Operation);
    });

    expect(operations).toHaveLength(Object.keys(entriesRaw).length);
  });

  it('should throw an error if account not found', async () => {
    const entriesRaw: CreateEntryRequestDTO = {
      description: 'Test Entry',
      operations: [
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
      ],
    };

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
        entriesRaw,
        accountsMap,
        currencySystemAccountsMap,
      ),
    ).rejects.toThrowError(
      `Account not found in map: ${entriesRaw.operations[0].accountId}`,
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

    const entryOperationsInput: CreateEntryRequestDTO = {
      description: 'Test Entry',
      operations: [
        {
          ...testData.from.operation,
          amount: testData.from.amount.valueOf(),
        },
        {
          ...testData.to.operation,
          amount: testData.to.amount.valueOf(),
        },
      ],
    };

    // Create accountsMap for the new signature (only user accounts, system accounts will be fetched separately)
    const accountsMap = new Map([
      [testData.from.account.getId().valueOf(), testData.from.account],
      [testData.to.account.getId().valueOf(), testData.to.account],
    ]);

    const currencySystemAccountsMap = new Map([
      [Currency.create('USD').valueOf(), usdSystemAccount],
      [Currency.create('EUR').valueOf(), eurSystemAccount],
    ]);

    const mockedOperationFrom = Operation.create(
      user,
      testData.from.account,
      entry,
      fromAmount,
      testData.from.operation.description,
    );

    const mockedOperationTo = Operation.create(
      user,
      testData.to.account,
      entry,
      toAmount,
      testData.to.operation.description,
    );

    const mockedSystemOperationFrom = Operation.create(
      user,
      testData.from.systemAccount,
      entry,
      testData.from.systemAmount,
      'System ' + testData.from.operation.description,
    );

    const mockedSystemOperationTo = Operation.create(
      user,
      testData.to.systemAccount,
      entry,
      testData.to.systemAmount,
      'System ' + testData.to.operation.description,
    );

    mockedSaveWithIdRetry
      .mockResolvedValueOnce(mockedOperationFrom)
      .mockResolvedValueOnce(mockedOperationTo)
      .mockResolvedValueOnce(mockedSystemOperationFrom)
      .mockResolvedValueOnce(mockedSystemOperationTo);

    const operations = await operationFactory.createOperationsForEntry(
      user,
      entry,
      entryOperationsInput,
      accountsMap,
      currencySystemAccountsMap,
    );

    expect(operations).toHaveLength(4);

    const expectedResultsDTO: {
      currency: Currency;
      amount: Amount;
      isSystem: boolean;
    }[] = [
      {
        amount: testData.from.amount,
        currency: testData.from.account.currency,
        isSystem: false,
      },
      {
        amount: testData.to.amount,
        currency: testData.to.account.currency,
        isSystem: false,
      },
      {
        amount: testData.from.systemAmount,
        currency: fromCurrency,
        isSystem: true,
      },
      {
        amount: testData.to.systemAmount,
        currency: toCurrency,
        isSystem: true,
      },
    ];

    operations.forEach((operation, index) => {
      const match = expectedResultsDTO[index];

      expect(operation.amount.valueOf()).toBe(match.amount.valueOf());
      expect(operation.currency.valueOf()).toBe(match.currency.valueOf());
    });

    for (let i = 0; i < entryOperationsInput.operations.length; i++) {
      const resultOperation = operations[i];
      const systemOperation = operations[i + 2];
      const systemAmount = Amount.fromPersistence(
        systemOperation.amount.valueOf(),
      );

      expect(resultOperation.amount.equals(systemAmount.negate())).toBe(true);
      expect(systemOperation.isSystem).toBe(true);
      expect(resultOperation.isSystem).toBe(false);
    }
  });

  it('should throw an error if the balances of operations do not equal zero', async () => {
    const entriesRaw: CreateEntryRequestDTO = {
      description: 'Test Entry',
      operations: [
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
      ],
    };

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
        entriesRaw,
        accountsMap,
        currencySystemAccountsMap,
      ),
    ).rejects.toThrowError(UnbalancedEntryError);
  });
});
