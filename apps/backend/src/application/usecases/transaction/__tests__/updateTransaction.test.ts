import { TransactionMapperInterface } from 'src/application';
import {
  EntryResponseDTO,
  TransactionResponseDTO,
  UpdateTransactionRequestDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { EntriesService } from 'src/application/services';
import {
  createAccount,
  createEntry,
  createOperation,
  createTransaction,
  createUser,
} from 'src/db/createTestUser';
import { TransactionWithRelations } from 'src/db/schema';
import { Account, Entry, Operation, Transaction, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { UpdateTransactionUseCase } from '../UpdateTransaction';

describe('UpdateTransactionUseCase', () => {
  let user: User;
  let transaction: Transaction;
  let entry: Entry;
  let operationFrom: Operation;
  let operationTo: Operation;
  let account: Account;
  let entries: TransactionWithRelations['entries'];
  let transactionDBRow: TransactionWithRelations;

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
    update: vi.fn(),
  };

  const mockEntriesService = {
    updateEntriesWithOperations: vi.fn(),
  };

  const mockEnsureEntityExistsAndOwned = vi.fn();

  const mockTransactionMapper = {
    toResponseDTO: vi.fn(),
  };

  const updateTransactionUseCase = new UpdateTransactionUseCase(
    mockTransactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    mockEntriesService as unknown as EntriesService,
    mockEnsureEntityExistsAndOwned,
    mockTransactionMapper as unknown as TransactionMapperInterface,
  );

  beforeAll(async () => {
    user = await createUser();

    account = createAccount(user);
    transaction = createTransaction(user);
    entry = createEntry(user, transaction, []);

    operationFrom = createOperation(
      user,
      account,
      entry,
      Amount.create('100'),
      'From Operation',
    );

    operationTo = createOperation(
      user,
      account,
      entry,
      Amount.create('100'),
      'To Operation',
    );

    entry.addOperations([operationFrom, operationTo]);

    transaction.addEntry(entry);

    entries = [
      {
        ...entry.toPersistence(),
        operations: [
          operationFrom.toPersistence(),
          operationTo.toPersistence(),
        ],
      },
    ];

    transactionDBRow = {
      ...transaction.toPersistence(),
      entries,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update transaction correctly without updating entries', async () => {
    const updateData: UpdateTransactionRequestDTO = {
      description: 'Updated Transaction Description',
      entries: { create: [], delete: [], update: [] },
      postingDate: transactionDBRow.postingDate,
      transactionDate: transactionDBRow.transactionDate,
    };

    const mockedResultWithoutUpdatingEntries: TransactionResponseDTO = {
      createdAt: transactionDBRow.createdAt,
      description: transactionDBRow.description,
      entries: [],
      id: transactionDBRow.id,
      postingDate: transactionDBRow.postingDate,
      transactionDate: transactionDBRow.transactionDate,
      updatedAt: transactionDBRow.updatedAt,
      userId: transactionDBRow.userId,
    };

    mockTransactionMapper.toResponseDTO.mockReturnValue({
      ...mockedResultWithoutUpdatingEntries,
      description: updateData.description,
    });

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transactionDBRow);

    const updatedTransaction = await updateTransactionUseCase.execute(
      user,
      transactionDBRow.id,
      updateData,
    );

    expect(updatedTransaction.id).toBe(transactionDBRow.id);
    expect(updatedTransaction.description).toBe(updateData.description);
    expect(updatedTransaction.postingDate).toBe(updateData.postingDate);
    expect(updatedTransaction.transactionDate).toBe(updateData.transactionDate);
    expect(mockTransactionRepository.update).toHaveBeenCalledWith(
      user.getId().valueOf(),
      transactionDBRow.id,
      expect.objectContaining({
        description: updateData.description,
      }),
    );
  });

  it('should update transaction and its entries correctly', async () => {
    mockEnsureEntityExistsAndOwned.mockResolvedValue(transactionDBRow);

    const newEntry = createEntry(user, transaction, []);

    const newOperationFrom = createOperation(
      user,
      account,
      newEntry,
      Amount.create('200'),
      'Updated From Operation',
    );
    const newOperationTo = createOperation(
      user,
      account,
      newEntry,
      Amount.create('-200'),
      'Updated To Operation',
    );

    newEntry.addOperations([newOperationFrom, newOperationTo]);

    const entries = [newEntry];

    const updatedTransactionPayload: UpdateTransactionRequestDTO = {
      description: 'Updated Transaction Description with Entries',
      entries: {
        create: [
          {
            description: newEntry.description,
            operations: [
              {
                accountId: newOperationFrom.getAccountId().valueOf(),
                amount: newOperationFrom.amount.valueOf(),
                description: newOperationFrom.description,
              },
              {
                accountId: newOperationTo.getAccountId().valueOf(),
                amount: newOperationTo.amount.valueOf(),
                description: newOperationTo.description,
              },
            ],
          },
        ],
        delete: [],
        update: [],
      },
      postingDate: transactionDBRow.postingDate,
      transactionDate: transactionDBRow.transactionDate,
    };

    const operationFromResponseDTO: EntryResponseDTO['operations'][0] = {
      accountId: newOperationFrom.getAccountId().valueOf(),
      amount: newOperationFrom.amount.valueOf(),
      createdAt: newOperationFrom.getCreatedAt().valueOf(),
      description: newOperationFrom.description,
      entryId: newEntry.getId().valueOf(),
      id: newOperationFrom.getId().valueOf(),
      isSystem: newOperationFrom.isSystem,
      updatedAt: newOperationFrom.getUpdatedAt().valueOf(),
      userId: newOperationFrom.getUserId().valueOf(),
    };

    const operationToResponseDTO: EntryResponseDTO['operations'][1] = {
      accountId: newOperationTo.getAccountId().valueOf(),
      amount: newOperationTo.amount.valueOf(),
      createdAt: newOperationTo.getCreatedAt().valueOf(),
      description: newOperationTo.description,
      entryId: newEntry.getId().valueOf(),
      id: newOperationTo.getId().valueOf(),
      isSystem: newOperationTo.isSystem,
      updatedAt: newOperationTo.getUpdatedAt().valueOf(),
      userId: newOperationTo.getUserId().valueOf(),
    };

    const operations: EntryResponseDTO['operations'] = [
      operationFromResponseDTO,
      operationToResponseDTO,
    ];

    const entryResponseDTO: EntryResponseDTO = {
      createdAt: newEntry.getCreatedAt().valueOf(),
      description: newEntry.description,
      id: newEntry.getId().valueOf(),
      isTombstone: newEntry.isDeleted(),
      operations,
      transactionId: transactionDBRow.id,
      updatedAt: newEntry.getUpdatedAt().valueOf(),
      userId: user.getId().valueOf(),
    };

    const mockedResultWithUpdatingEntries: TransactionResponseDTO = {
      createdAt: transactionDBRow.createdAt,
      description: transactionDBRow.description,
      entries: [entryResponseDTO],
      id: transactionDBRow.id,
      postingDate: transactionDBRow.postingDate,
      transactionDate: transactionDBRow.transactionDate,
      updatedAt: transactionDBRow.updatedAt,
      userId: user.getId().valueOf(),
    };

    mockTransactionMapper.toResponseDTO.mockReturnValue({
      ...mockedResultWithUpdatingEntries,
      description: updatedTransactionPayload.description,
    });

    const updatedTransaction = await updateTransactionUseCase.execute(
      user,
      transactionDBRow.id,
      updatedTransactionPayload,
    );

    expect(updatedTransaction.id).toBe(transactionDBRow.id);
    expect(updatedTransaction.description).toBe(
      updatedTransactionPayload.description,
    );
    expect(updatedTransaction.postingDate).toBe(
      updatedTransactionPayload.postingDate,
    );
    expect(updatedTransaction.transactionDate).toBe(
      updatedTransactionPayload.transactionDate,
    );

    expect(updatedTransaction.entries).toHaveLength(entries.length);

    expect(mockTransactionRepository.update).toHaveBeenCalledWith(
      user.getId().valueOf(),
      transactionDBRow.id,
      expect.objectContaining({
        description: updatedTransactionPayload.description,
      }),
    );

    expect(
      mockEntriesService.updateEntriesWithOperations,
    ).toHaveBeenCalledTimes(1);

    expect(mockEntriesService.updateEntriesWithOperations).toHaveBeenCalledWith(
      user,
      expect.any(Transaction),
      updatedTransactionPayload.entries,
    );

    updatedTransaction.entries.forEach((entryDTO) => {
      expect(entryDTO).toBeDefined();
      expect(entryDTO.id).toBe(newEntry.getId().valueOf());
      expect(entryDTO.operations).toHaveLength(operations.length);
      expect(entryDTO.createdAt).toBe(newEntry.getCreatedAt().valueOf());
      expect(entryDTO.isTombstone).toBe(newEntry.isDeleted());
      expect(entryDTO.transactionId).toBe(transactionDBRow.id);
      expect(entryDTO.updatedAt).toBe(newEntry.getUpdatedAt().valueOf());
      expect(entryDTO.userId).toBe(user.getId().valueOf());

      entryDTO.operations.forEach((op, index) => {
        const expectedOp = operations[index];

        expect(op).toBeDefined();
        expect(op.accountId).toBe(expectedOp.accountId);
        expect(op.amount).toBe(expectedOp.amount);
        expect(op.createdAt).toBe(expectedOp.createdAt);
        expect(op.description).toBe(expectedOp.description);
        expect(op.entryId).toBe(expectedOp.entryId);
        expect(op.id).toBe(expectedOp.id);
        expect(op.isSystem).toBe(expectedOp.isSystem);
        expect(op.updatedAt).toBe(expectedOp.updatedAt);
        expect(op.userId).toBe(expectedOp.userId);
      });
    });
  });

  it.todo('should update transaction if there are changes');
  it.todo('should not update transaction if there are no changes');
  it.todo('should not update entries if there are no changes');
});
