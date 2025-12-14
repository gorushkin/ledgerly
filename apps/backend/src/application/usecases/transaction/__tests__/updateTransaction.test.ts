import { TransactionMapper, TransactionMapperInterface } from 'src/application';
import { compareTransaction } from 'src/application/comparers';
import {
  TransactionResponseDTO,
  UpdateTransactionRequestDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { EntriesService } from 'src/application/services';
import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils';
import { EntryBuilder } from 'src/db/test-utils/testEntityBuilder';
import { Account, Transaction, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core';
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
  Mock,
  beforeEach,
} from 'vitest';

import { UpdateTransactionUseCase } from '../UpdateTransaction';

vi.mock('src/application/comparers', () => ({
  compareTransaction: vi.fn(),
}));

describe('UpdateTransactionUseCase', () => {
  let user: User;
  let transaction: Transaction;
  let account1: Account;
  let account2: Account;

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

  const mapper = new TransactionMapper();

  const updateTransactionUseCase = new UpdateTransactionUseCase(
    mockTransactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    mockEntriesService as unknown as EntriesService,
    mockEnsureEntityExistsAndOwned,
    mockTransactionMapper as unknown as TransactionMapperInterface,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    const transactionBuilder = TransactionBuilder.create(user);

    const { getAccountByKey, transaction: predefinedTransaction } =
      transactionBuilder
        .withAccounts(['USD', 'EUR'])
        .withSystemAccounts()
        .withEntry('First Entry', [
          {
            accountKey: 'USD',
            amount: Amount.create('10000'),
            description: 'From Operation',
          },
          {
            accountKey: 'EUR',
            amount: Amount.create('-10000'),
            description: 'To Operation',
          },
        ])
        .build();

    account1 = getAccountByKey('USD');
    account2 = getAccountByKey('EUR');

    transaction = predefinedTransaction;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update transaction correctly without updating entries', async () => {
    const data: UpdateTransactionRequestDTO = {
      description: 'Updated Transaction Description',
      entries: { create: [], delete: [], update: [] },
      postingDate: transaction.getPostingDate().valueOf(),
      transactionDate: transaction.getTransactionDate().valueOf(),
    };

    const transactionEntries = transaction.getEntries();

    mockTransactionMapper.toResponseDTO.mockImplementation(
      (transaction: Transaction): TransactionResponseDTO =>
        mapper.toResponseDTO(transaction),
    );

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);

    (compareTransaction as Mock).mockReturnValueOnce('updatedMetadata');

    const updatedTransaction = await updateTransactionUseCase.execute(
      user,
      transaction.getId().valueOf(),
      data,
    );

    updatedTransaction.entries.forEach((entryDTO) => {
      const originalEntry = transactionEntries.find(
        (e) => e.getId().valueOf() === entryDTO.id,
      );

      if (!originalEntry) {
        throw new Error('Original entry not found');
      }

      expect(entryDTO.operations).toHaveLength(
        originalEntry.getOperations().length,
      );

      expect(entryDTO.createdAt).toBe(originalEntry.getCreatedAt().valueOf());
      expect(entryDTO.isTombstone).toBe(originalEntry.isDeleted());
      expect(entryDTO.transactionId).toBe(transaction.getId().valueOf());
      expect(entryDTO.updatedAt).toBe(originalEntry.getUpdatedAt().valueOf());
      expect(entryDTO.userId).toBe(user.getId().valueOf());

      entryDTO.operations.forEach((opDTO) => {
        const originalOp = originalEntry
          .getOperations()
          .find((o) => o.getId().valueOf() === opDTO.id);

        if (!originalOp) {
          throw new Error('Original operation not found');
        }

        expect(opDTO.accountId).toBe(originalOp.getAccountId().valueOf());
        expect(opDTO.amount).toBe(originalOp.amount.valueOf());
        expect(opDTO.createdAt).toBe(originalOp.getCreatedAt().valueOf());
        expect(opDTO.description).toBe(originalOp.description);
        expect(opDTO.entryId).toBe(originalEntry.getId().valueOf());
        expect(opDTO.isSystem).toBe(originalOp.isSystem);
        expect(opDTO.updatedAt).toBe(originalOp.getUpdatedAt().valueOf());
        expect(opDTO.userId).toBe(user.getId().valueOf());
      });
    });

    expect(updatedTransaction.entries).toHaveLength(transactionEntries.length);

    transactionEntries.forEach((entry) => {
      const entryDTO = updatedTransaction.entries.find(
        (e) => e.id === entry.getId().valueOf(),
      );

      if (!entryDTO) {
        throw new Error('Entry DTO not found');
      }

      expect(entryDTO).toBeDefined();
      expect(entryDTO.id).toBe(entry.getId().valueOf());
      expect(entryDTO.createdAt).toBe(entry.getCreatedAt().valueOf());
      expect(entryDTO.isTombstone).toBe(entry.isDeleted());
      expect(entryDTO.transactionId).toBe(transaction.getId().valueOf());
      expect(entryDTO.updatedAt).toBe(entry.getUpdatedAt().valueOf());
      expect(entryDTO.userId).toBe(user.getId().valueOf());

      const operations = entry.getOperations();

      expect(entryDTO.operations).toHaveLength(operations.length);

      operations.forEach((op) => {
        const opDTO = entryDTO.operations.find(
          (o) => o.id === op.getId().valueOf(),
        );

        if (!opDTO) {
          throw new Error('Operation DTO not found');
        }

        expect(opDTO).toBeDefined();
        expect(opDTO.accountId).toBe(op.getAccountId().valueOf());
        expect(opDTO.amount).toBe(op.amount.valueOf());
        expect(opDTO.createdAt).toBe(op.getCreatedAt().valueOf());
        expect(opDTO.description).toBe(op.description);
        expect(opDTO.entryId).toBe(entry.getId().valueOf());
        expect(opDTO.id).toBe(op.getId().valueOf());
        expect(opDTO.isSystem).toBe(op.isSystem);
        expect(opDTO.updatedAt).toBe(op.getUpdatedAt().valueOf());
        expect(opDTO.userId).toBe(user.getId().valueOf());
      });
    });

    expect(updatedTransaction.id).toBe(transaction.getId().valueOf());
    expect(updatedTransaction.description).toBe(data.description);
    expect(updatedTransaction.postingDate).toBe(data.postingDate);
    expect(updatedTransaction.transactionDate).toBe(data.transactionDate);

    expect(mockTransactionRepository.update).toHaveBeenCalledWith(
      user.getId().valueOf(),
      transaction.getId().valueOf(),
      expect.objectContaining({
        description: data.description,
      }),
    );

    expect(
      mockEntriesService.updateEntriesWithOperations,
    ).not.toHaveBeenCalled();
  });

  it('should update transaction and its entries correctly', async () => {
    const entryBuilder = new EntryBuilder(transaction);

    const newEntry = entryBuilder
      .withUser(user)
      .withDescription('New Entry with Operations')
      .withOperation({
        account: account1,
        amount: Amount.create('200'),
        description: 'Updated From Operation',
      })
      .withOperation({
        account: account2,
        amount: Amount.create('-200'),
        description: 'Updated To Operation',
      })
      .build();

    const [newOperationFrom, newOperationTo] = newEntry.getOperations();

    const updatedTransactionPayload: UpdateTransactionRequestDTO = {
      description: transaction.description,
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
      postingDate: transaction.getPostingDate().valueOf(),
      transactionDate: transaction.getTransactionDate().valueOf(),
    };

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);

    (compareTransaction as Mock).mockReturnValueOnce('updatedMetadata');
    const prevTransactionEntries = transaction.getEntries();

    mockEntriesService.updateEntriesWithOperations.mockImplementation(
      (_: User, transaction: Transaction) => {
        transaction.addEntry(newEntry);

        return transaction;
      },
    );

    mockTransactionMapper.toResponseDTO.mockImplementation(
      (transaction: Transaction): TransactionResponseDTO =>
        mapper.toResponseDTO(transaction),
    );

    const updatedTransaction = await updateTransactionUseCase.execute(
      user,
      transaction.getId().valueOf(),
      updatedTransactionPayload,
    );

    const entriesCount =
      prevTransactionEntries.length +
      updatedTransactionPayload.entries.create.length;

    expect(updatedTransaction.entries).toHaveLength(entriesCount);

    prevTransactionEntries.forEach((entry) => {
      const entryDTO = updatedTransaction.entries.find(
        (e) => e.id === entry.getId().valueOf(),
      );

      if (!entryDTO) {
        throw new Error('Entry DTO not found');
      }

      expect(entryDTO).toBeDefined();
      expect(entryDTO.id).toBe(entry.getId().valueOf());
      expect(entryDTO.createdAt).toBe(entry.getCreatedAt().valueOf());
      expect(entryDTO.isTombstone).toBe(entry.isDeleted());
      expect(entryDTO.transactionId).toBe(transaction.getId().valueOf());
      expect(entryDTO.updatedAt).toBe(entry.getUpdatedAt().valueOf());
      expect(entryDTO.userId).toBe(user.getId().valueOf());

      const operations = entry.getOperations();

      expect(entryDTO.operations).toHaveLength(operations.length);

      operations.forEach((op) => {
        const opDTO = entryDTO.operations.find(
          (o) => o.id === op.getId().valueOf(),
        );

        if (!opDTO) {
          throw new Error('Operation DTO not found');
        }

        expect(opDTO).toBeDefined();
        expect(opDTO.accountId).toBe(op.getAccountId().valueOf());
        expect(opDTO.amount).toBe(op.amount.valueOf());
        expect(opDTO.createdAt).toBe(op.getCreatedAt().valueOf());
        expect(opDTO.description).toBe(op.description);
        expect(opDTO.entryId).toBe(entry.getId().valueOf());
        expect(opDTO.id).toBe(op.getId().valueOf());
        expect(opDTO.isSystem).toBe(op.isSystem);
        expect(opDTO.updatedAt).toBe(op.getUpdatedAt().valueOf());
        expect(opDTO.userId).toBe(user.getId().valueOf());
      });
    });

    expect(updatedTransaction.description).toBe(
      updatedTransactionPayload.description,
    );

    expect(updatedTransaction.entries).toBeDefined();

    expect(mockEnsureEntityExistsAndOwned).toHaveBeenCalledExactlyOnceWith(
      user,
      expect.any(Function),
      transaction.getId().valueOf(),
      'Transaction',
    );

    expect(mockTransactionRepository.update).toHaveBeenCalledWith(
      user.getId().valueOf(),
      transaction.getId().valueOf(),
      expect.objectContaining({
        description: updatedTransactionPayload.description,
      }),
    );

    expect(mockEntriesService.updateEntriesWithOperations).toHaveBeenCalled();
  });

  it('should not update transaction if there are changes', async () => {
    const updatedTransactionPayload: UpdateTransactionRequestDTO = {
      description: transaction.description,
      entries: {
        create: [],
        delete: [],
        update: [],
      },
      postingDate: transaction.getPostingDate().valueOf(),
      transactionDate: transaction.getTransactionDate().valueOf(),
    };

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);

    (compareTransaction as Mock).mockReturnValueOnce('unchanged');

    mockTransactionMapper.toResponseDTO.mockImplementation(
      (transaction: Transaction): TransactionResponseDTO =>
        mapper.toResponseDTO(transaction),
    );

    const updatedTransaction = await updateTransactionUseCase.execute(
      user,
      transaction.getId().valueOf(),
      updatedTransactionPayload,
    );

    expect(updatedTransaction.id).toBe(transaction.getId().valueOf());
    expect(updatedTransaction.description).toBe(transaction.description);
    expect(updatedTransaction.postingDate).toBe(
      transaction.getPostingDate().valueOf(),
    );
    expect(updatedTransaction.transactionDate).toBe(
      transaction.getTransactionDate().valueOf(),
    );

    updatedTransaction.entries.forEach((entryDTO) => {
      const originalEntry = transaction
        .getEntries()
        .find((e) => e.getId().valueOf() === entryDTO.id);

      if (!originalEntry) {
        throw new Error('Original entry not found');
      }

      expect(entryDTO.operations).toHaveLength(
        originalEntry.getOperations().length,
      );

      expect(entryDTO.createdAt).toBe(originalEntry.getCreatedAt().valueOf());
      expect(entryDTO.isTombstone).toBe(originalEntry.isDeleted());
      expect(entryDTO.transactionId).toBe(transaction.getId().valueOf());
      expect(entryDTO.updatedAt).toBe(originalEntry.getUpdatedAt().valueOf());
      expect(entryDTO.userId).toBe(user.getId().valueOf());

      entryDTO.operations.forEach((opDTO) => {
        const originalOp = originalEntry
          .getOperations()
          .find((o) => o.getId().valueOf() === opDTO.id);

        if (!originalOp) {
          throw new Error('Original operation not found');
        }

        expect(opDTO.accountId).toBe(originalOp.getAccountId().valueOf());
        expect(opDTO.amount).toBe(originalOp.amount.valueOf());
        expect(opDTO.createdAt).toBe(originalOp.getCreatedAt().valueOf());
        expect(opDTO.description).toBe(originalOp.description);
        expect(opDTO.entryId).toBe(originalEntry.getId().valueOf());
        expect(opDTO.isSystem).toBe(originalOp.isSystem);
        expect(opDTO.updatedAt).toBe(originalOp.getUpdatedAt().valueOf());
        expect(opDTO.userId).toBe(user.getId().valueOf());
      });
    });

    expect(updatedTransaction.entries).toHaveLength(
      transaction.getEntries().length,
    );

    expect(mockTransactionRepository.update).not.toHaveBeenCalled();

    expect(
      mockEntriesService.updateEntriesWithOperations,
    ).not.toHaveBeenCalled();
  });
  it.todo('should not update transaction if there are no changes');
  it.todo('should not update entries if there are no changes');
});
