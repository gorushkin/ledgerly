import { DEFAULT_TRANSACTION_QUERY } from '@ledgerly/shared/constants';
import { UUID } from '@ledgerly/shared/types';
import { TransactionResponseDTO } from 'src/application/dto';
import {
  AccountRepositoryInterface,
  TransactionQueryRepositoryInterface,
} from 'src/application/interfaces';
import { OperationDbRow, TransactionWithRelations } from 'src/db/schema';
import {
  Amount,
  Currency,
  DateValue,
  Id,
  Timestamp,
} from 'src/domain/domain-core';
import { ForbiddenAccessError } from 'src/infrastructure/infrastructure.errors';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GetAllTransactionsUseCase } from '../GetAllTransactions';

describe('GetAllTransactionsUseCase', () => {
  const userId = Id.create().valueOf();
  const accountId = Id.create().valueOf();
  const transactionQueryRepository = {
    findAll: vi.fn(),
  };

  const accountRepository = {
    ensureUserOwnsAccount: vi.fn(),
  };

  const getAllTransactionsUseCase = new GetAllTransactionsUseCase(
    transactionQueryRepository as unknown as TransactionQueryRepositoryInterface,
    accountRepository as unknown as AccountRepositoryInterface,
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  const buildOperation = (
    transactionId: UUID,
    userId: UUID,
    overrides?: Partial<OperationDbRow>,
  ): OperationDbRow => ({
    accountId: Id.create().valueOf(),
    amount: Amount.create('100').valueOf(),
    createdAt: Timestamp.create().valueOf(),
    description: 'Operation',
    id: Id.create().valueOf(),
    isSystem: false,
    isTombstone: false,
    transactionId,
    updatedAt: Timestamp.create().valueOf(),
    userId,
    value: Amount.create('100').valueOf(),
    ...overrides,
  });

  const buildTransaction = (): TransactionWithRelations => {
    const transactionId = Id.create().valueOf();

    return {
      createdAt: Timestamp.create().valueOf(),
      currency: Currency.create('USD').valueOf(),
      description: 'Test transaction',
      id: transactionId,
      isTombstone: false,
      operations: [buildOperation(transactionId, userId)],
      postingDate: DateValue.restore('2024-01-01').valueOf(),
      transactionDate: DateValue.restore('2024-01-01').valueOf(),
      updatedAt: Timestamp.create().valueOf(),
      userId,
      version: 1,
    };
  };

  it('should retrieve transactions by account ID', async () => {
    const mockTransaction = buildTransaction();
    const mockTransactions = [mockTransaction];

    transactionQueryRepository.findAll.mockResolvedValue({
      items: mockTransactions,
      total: mockTransactions.length,
    });

    const result = await getAllTransactionsUseCase.execute(userId, {
      ...DEFAULT_TRANSACTION_QUERY,
      accountId,
    });

    expect(accountRepository.ensureUserOwnsAccount).toHaveBeenCalledWith(
      userId,
      accountId,
    );
    expect(transactionQueryRepository.findAll).toHaveBeenCalledWith(userId, {
      ...DEFAULT_TRANSACTION_QUERY,
      accountId,
    });

    expect(result.items).toHaveLength(mockTransactions.length);
    expect(result.items[0].id).toBe(mockTransaction.id);
    expect(result.items[0].version).toBe(mockTransaction.version);
    expect(result.items[0]).not.toHaveProperty('isTombstone');

    expect(result.pagination).toEqual({
      hasNextPage: false,
      hasPreviousPage: false,
      page: 1,
      pageSize: 20,
      total: mockTransactions.length,
      totalPages: 1,
    });

    result.items[0].operations.forEach(
      (operation: TransactionResponseDTO['operations'][number]) => {
        expect(operation).not.toHaveProperty('isTombstone');
      },
    );
  });

  it('should retrieve all transactions without account ownership check when accountId is not provided', async () => {
    const mockTransaction = buildTransaction();
    const mockTransactions = [mockTransaction];

    transactionQueryRepository.findAll.mockResolvedValue({
      items: mockTransactions,
      total: mockTransactions.length,
    });

    const result = await getAllTransactionsUseCase.execute(
      userId,
      DEFAULT_TRANSACTION_QUERY,
    );

    expect(accountRepository.ensureUserOwnsAccount).not.toHaveBeenCalled();
    expect(transactionQueryRepository.findAll).toHaveBeenCalledWith(
      userId,
      DEFAULT_TRANSACTION_QUERY,
    );
    expect(result.items).toHaveLength(mockTransactions.length);
    expect(result.items[0].id).toBe(mockTransaction.id);
    expect(result.items[0]).not.toHaveProperty('isTombstone');
  });

  it('should build pagination metadata for a middle page', async () => {
    const mockTransaction1 = buildTransaction();
    const mockTransaction2 = buildTransaction();

    const mockTransactions = [mockTransaction1, mockTransaction2];

    const totalTransactions = 5;
    const page = 2;
    const pageSize = 2;

    transactionQueryRepository.findAll.mockResolvedValue({
      items: mockTransactions,
      total: totalTransactions,
    });

    const result = await getAllTransactionsUseCase.execute(userId, {
      ...DEFAULT_TRANSACTION_QUERY,
      page,
      pageSize,
    });

    expect(result.pagination).toEqual({
      hasNextPage: true,
      hasPreviousPage: true,
      page,
      pageSize,
      total: totalTransactions,
      totalPages: Math.ceil(totalTransactions / pageSize),
    });
  });

  it('should not report a previous page when there are no results', async () => {
    transactionQueryRepository.findAll.mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await getAllTransactionsUseCase.execute(userId, {
      ...DEFAULT_TRANSACTION_QUERY,
      page: 2,
    });

    expect(result.pagination).toEqual({
      hasNextPage: false,
      hasPreviousPage: false,
      page: 2,
      pageSize: DEFAULT_TRANSACTION_QUERY.pageSize,
      total: 0,
      totalPages: 0,
    });
  });

  it('should throw an error if user does not own the account', async () => {
    accountRepository.ensureUserOwnsAccount.mockRejectedValue(
      new ForbiddenAccessError(
        'You do not have permission to access this account',
      ),
    );

    await expect(
      getAllTransactionsUseCase.execute(userId, {
        ...DEFAULT_TRANSACTION_QUERY,
        accountId,
      }),
    ).rejects.toThrow('You do not have permission to access this account');

    expect(accountRepository.ensureUserOwnsAccount).toHaveBeenCalledWith(
      userId,
      accountId,
    );

    expect(transactionQueryRepository.findAll).not.toHaveBeenCalled();
  });
});
