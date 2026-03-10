import { OperationMapper, TransactionMapper } from 'src/application';
import { UpdateTransactionRequestDTO } from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionContextLoader } from 'src/application/services/TransactionService/transaction.context-loader';
import { createUser } from 'src/db/createTestUser';
import { compareEntities, TransactionBuilder } from 'src/db/test-utils';
import { Operation, Transaction, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core';
import { beforeAll, describe, expect, it, vi, beforeEach } from 'vitest';

import { UpdateTransactionUseCase } from '../UpdateTransaction';
import { TransactionBuildContext } from 'src/domain/transactions/types';

vi.mock('src/application/comparers', () => ({
  compareTransaction: vi.fn(),
}));

describe('UpdateTransactionUseCase', () => {
  let user: User;

  let transaction: Transaction;
  let operations: Operation[];

  let transactionContext: TransactionBuildContext;

  const mockTransactionManager = {
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  const mockTransactionRepository = {
    getById: vi.fn(),
    getDB: vi.fn().mockReturnValue({
      transaction: <T>(cb: (trx: unknown) => T): T => cb({}),
    }),
    rootSave: vi.fn(),
  };

  const mockEntriesService = {
    updateEntriesWithOperations: vi.fn(),
  };

  const mockEnsureEntityExistsAndOwned = vi.fn();

  const mockTransactionContextLoader = {
    loadContext: vi.fn(),
  };

  const updateTransactionUseCase = new UpdateTransactionUseCase(
    mockTransactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    mockEnsureEntityExistsAndOwned,
    mockTransactionContextLoader as unknown as TransactionContextLoader,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    const transactionBuilder = TransactionBuilder.create(user);

    const data = transactionBuilder
      .withAccounts(['USD', 'EUR'])
      .withOperations([
        {
          accountKey: 'USD',
          amount: Amount.create('10000').valueOf(),
          description: 'From Operation',
          value: Amount.create('10000').valueOf(),
        },
        {
          accountKey: 'EUR',
          amount: Amount.create('-10000').valueOf(),
          description: 'To Operation',
          value: Amount.create('-10000').valueOf(),
        },
      ])
      .attachOperations()
      .build();

    operations = data.operations;

    const predefinedTransaction = data.transaction;

    transactionContext = data.transactionContext;

    transaction = predefinedTransaction;
  });

  it('should update transaction correctly without updating entries', async () => {
    const data: UpdateTransactionRequestDTO = {
      description: 'Updated Transaction Description',
      operations: { create: [], delete: [], update: [] },
      postingDate: transaction.getPostingDate().valueOf(),
      transactionDate: transaction.getTransactionDate().valueOf(),
    };

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);

    mockTransactionContextLoader.loadContext.mockResolvedValue(
      transactionContext,
    );

    const updatedTransaction = await updateTransactionUseCase.execute(
      user,
      transaction.getId().valueOf(),
      data,
    );

    updatedTransaction.operations.forEach((opDTO) => {
      const originalOp = operations.find(
        (o) => o.getId().valueOf() === opDTO.id,
      );

      const operationResponse = OperationMapper.toResponseDTO(originalOp!);

      expect(originalOp).toBeDefined();

      compareEntities(opDTO, operationResponse);
    });

    expect(updatedTransaction.operations).toHaveLength(operations.length);

    expect(updatedTransaction.id).toBe(transaction.getId().valueOf());
    expect(updatedTransaction.description).toBe(data.description);
    expect(updatedTransaction.postingDate).toBe(data.postingDate);
    expect(updatedTransaction.transactionDate).toBe(data.transactionDate);

    expect(mockTransactionRepository.rootSave).toHaveBeenCalledWith(
      user.getId().valueOf(),
      transaction,
    );

    expect(
      mockEntriesService.updateEntriesWithOperations,
    ).not.toHaveBeenCalled();
  });

  it('should update transaction and its entries correctly', async () => {
    const data: UpdateTransactionRequestDTO = {
      description: 'Updated Transaction Description',
      operations: {
        create: [
          {
            accountId: transaction.getOperations()[0].getAccountId().valueOf(),
            amount: Amount.create('500').valueOf(),
            description: 'New Operation Split 1',
            transactionId: transaction.getId().valueOf(),
            value: Amount.create('500').valueOf(),
          },
          {
            accountId: transaction.getOperations()[0].getAccountId().valueOf(),
            amount: Amount.create('-500').valueOf(),
            description: 'New Operation Split 2',
            transactionId: transaction.getId().valueOf(),
            value: Amount.create('-500').valueOf(),
          },
        ],
        delete: [],
        update: [],
      },
      postingDate: transaction.getPostingDate().valueOf(),
      transactionDate: transaction.getTransactionDate().valueOf(),
    };

    const initialTransactionSnapshots = transaction
      .getOperations()
      .map((op) => op.toSnapshot());

    mockTransactionContextLoader.loadContext.mockResolvedValue(
      transactionContext,
    );

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);

    const updatedTransaction = await updateTransactionUseCase.execute(
      user,
      transaction.getId().valueOf(),
      data,
    );

    expect(updatedTransaction.operations).toHaveLength(
      initialTransactionSnapshots.length + data.operations.create.length,
    );

    updatedTransaction.operations.forEach((opDTO) => {
      const originalOp = operations.find(
        (o) => o.getId().valueOf() === opDTO.id,
      );

      if (originalOp) {
        const operationResponse = OperationMapper.toResponseDTO(originalOp);
        compareEntities(opDTO, operationResponse);
        return;
      }

      const createdOpDTO = data.operations.create.find(
        (o) =>
          o.accountId === opDTO.accountId &&
          o.amount === opDTO.amount &&
          o.description === opDTO.description,
      );

      expect(createdOpDTO).toBeDefined();
      expect(opDTO.transactionId).toBe(transaction.getId().valueOf());
      expect(opDTO.id).toBeDefined();
      expect(opDTO.createdAt).toBeDefined();
      expect(opDTO.updatedAt).toBeDefined();
      expect(opDTO.isSystem).toBe(false);
      expect(opDTO.userId).toBe(user.getId().valueOf());
    });

    expect(updatedTransaction.id).toBe(transaction.getId().valueOf());
    expect(updatedTransaction.postingDate).toBe(data.postingDate);
    expect(updatedTransaction.transactionDate).toBe(data.transactionDate);
    expect(updatedTransaction.description).toBe(data.description);

    expect(mockEnsureEntityExistsAndOwned).toHaveBeenCalledExactlyOnceWith(
      user,
      expect.any(Function),
      transaction.getId().valueOf(),
      'Transaction',
    );

    expect(
      mockTransactionContextLoader.loadContext,
    ).toHaveBeenCalledExactlyOnceWith(user, [
      ...data.operations.create,
      ...data.operations.update,
    ]);

    expect(mockTransactionRepository.rootSave).toHaveBeenCalledWith(
      user.getId().valueOf(),
      transaction,
    );
  });

  it.only('should not update transaction if there are changes', async () => {
    const data: UpdateTransactionRequestDTO = {
      description: transaction.description,
      operations: {
        create: [],
        delete: [],
        update: [],
      },
      postingDate: transaction.getPostingDate().valueOf(),
      transactionDate: transaction.getTransactionDate().valueOf(),
    };

    mockTransactionContextLoader.loadContext.mockResolvedValue(
      transactionContext,
    );

    const initialTransactionResponse =
      TransactionMapper.toResponseDTO(transaction);

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);

    const updatedTransaction = await updateTransactionUseCase.execute(
      user,
      transaction.getId().valueOf(),
      data,
    );

    compareEntities(updatedTransaction, initialTransactionResponse);

    expect(mockEnsureEntityExistsAndOwned).toHaveBeenCalledExactlyOnceWith(
      user,
      expect.any(Function),
      transaction.getId().valueOf(),
      'Transaction',
    );

    expect(
      mockTransactionContextLoader.loadContext,
    ).toHaveBeenCalledExactlyOnceWith(user, []);

    expect(mockTransactionRepository.rootSave).not.toHaveBeenCalled();

    initialTransactionResponse.operations.forEach((opDTO) => {
      const updatedOpDTO = updatedTransaction.operations.find(
        (o) => o.id === opDTO.id,
      );

      expect(updatedOpDTO).toBeDefined();

      compareEntities(updatedOpDTO!, opDTO);
    });

    expect(updatedTransaction.operations).toHaveLength(
      initialTransactionResponse.operations.length,
    );
  });
});
