import { OperationRepositoryInterface } from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import {
  createEntry,
  createTransaction,
  createUser,
} from 'src/db/createTestUser';
import { Account, Entry, Operation, User } from 'src/domain';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import { OperationFactory } from '../';

describe('OperationFactory', async () => {
  const user = await createUser();

  const transaction = createTransaction(user);

  const entry = createEntry(user, transaction, []);

  let operationFactory: OperationFactory;

  let mockOperationRepository: {
    create: ReturnType<typeof vi.fn>;
  };

  let mockAccountRepository: { getById: ReturnType<typeof vi.fn> };

  let mockedSaveWithIdRetry: SaveWithIdRetryType;

  const usdAccount = Account.create(
    user,
    Name.create('Test Account'),
    'Account for testing',
    Amount.create('0'),
    Currency.create('USD'),
    AccountType.create('asset'),
  );

  const eurAccount = Account.create(
    user,
    Name.create('Test Account'),
    'Account for testing',
    Amount.create('0'),
    Currency.create('EUR'),
    AccountType.create('asset'),
  );

  const accounts = [usdAccount, eurAccount];

  beforeEach(() => {
    mockOperationRepository = {
      create: vi.fn(),
    };

    mockAccountRepository = {
      getById: vi
        .fn()
        .mockResolvedValueOnce(usdAccount.toPersistence())
        .mockResolvedValueOnce(eurAccount.toPersistence()),
    };

    mockedSaveWithIdRetry = vi
      .fn()
      .mockResolvedValue({ name: 'mocked account' }) as SaveWithIdRetryType;

    operationFactory = new OperationFactory(
      mockOperationRepository as unknown as OperationRepositoryInterface,
      mockAccountRepository as unknown as AccountRepository,
      mockedSaveWithIdRetry,
    );
  });

  it('should create operations for entry', async () => {
    const mockedOperation1 = {
      operation: 'mocked operation 1',
    } as unknown as Operation;

    const mockedOperation2 = {
      operation: 'mocked operation 2',
    } as unknown as Operation;

    const mockedOperations = [mockedOperation1, mockedOperation2];

    vi.spyOn(Operation, 'create').mockReturnValueOnce(mockedOperations[0]);
    vi.spyOn(Operation, 'create').mockReturnValueOnce(mockedOperations[1]);

    const operationsRaw = [
      {
        accountId: accounts[0].getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
      {
        accountId: accounts[1].getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
    ];

    const operations = await operationFactory.createOperationsForEntry(
      user,
      entry,
      operationsRaw,
    );

    expect(mockAccountRepository.getById).toHaveBeenCalledTimes(
      operationsRaw.length,
    );

    expect(mockAccountRepository.getById).toHaveBeenNthCalledWith(
      1,
      user.getId().valueOf(),
      operationsRaw[0].accountId,
    );

    expect(mockAccountRepository.getById).toHaveBeenNthCalledWith(
      2,
      user.getId().valueOf(),
      operationsRaw[1].accountId,
    );

    expect(mockedSaveWithIdRetry).toHaveBeenCalledTimes(operationsRaw.length);

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
      (
        [calledUser, account, entry, amount, description]: [
          User,
          Account,
          Entry,
          Amount,
          string,
        ],
        index: number,
      ) => {
        const currAccount = accounts[index as keyof typeof accounts];

        const currOperation = operationsRaw[
          index as keyof typeof operationsRaw
        ] as unknown as Operation;

        expect(calledUser).toBe(user);
        expect(account).toEqual(currAccount);
        expect(account).toBeInstanceOf(Account);
        expect(entry).toBe(entry);
        expect(amount).toBeInstanceOf(Amount);
        expect(amount.valueOf()).toBe(currOperation.amount);
        expect(description).toBe(operationsRaw[index].description);
      },
    );

    expect(operations).toHaveLength(operationsRaw.length);

    operations.forEach((operation, index) => {
      expect(operation).toBe(mockedOperations[index]);
    });
  });

  it('should throw an error if account not found', async () => {
    mockAccountRepository.getById = vi.fn().mockResolvedValue(null);

    const operationsRaw = [
      {
        accountId: accounts[0].getId().valueOf(),
        amount: Amount.create('100').valueOf(),
        description: 'Operation 1',
      },
    ];

    await expect(
      operationFactory.createOperationsForEntry(user, entry, operationsRaw),
    ).rejects.toThrowError(`Account not found: ${operationsRaw[0].accountId}`);
  });
});
