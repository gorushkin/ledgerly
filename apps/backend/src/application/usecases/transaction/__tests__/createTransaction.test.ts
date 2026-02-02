import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionContextLoader } from 'src/application/services/TransactionService';
import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils/testEntityBuilder';
import { User, Transaction } from 'src/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTransactionUseCase } from '../CreateTransaction';

describe('CreateTransactionUseCase', () => {
  let user: User;

  const mockTransactionRepository = {
    rootSave: vi.fn(),
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

  const transactionData = {
    description: 'Test transaction',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
    userId: '123e4567-e89b-12d3-a456-426614174000',
  };

  const entriesData = [
    {
      description: 'First Entry',
      operations: [
        { accountKey: 'USD', amount: '10000', description: '1' },
        { accountKey: 'USD', amount: '-10000', description: '2' },
      ],
    },
  ];

  beforeEach(async () => {
    user = await createUser();
  });

  describe('execute', () => {
    it('should create a new transaction with entries successfully', async () => {
      const transactionBuilder = TransactionBuilder.create(user);

      const { entryContext, transactionDTO } = transactionBuilder
        .withSettings(transactionData)
        .withAccounts(['USD', 'EUR'])
        .withSystemAccounts()
        .withEntries(entriesData)
        .build();

      transactionContextLoader.loadContext.mockResolvedValue(entryContext);

      const result = await createTransactionUseCase.execute(
        user,
        transactionDTO,
      );

      expect(result.postingDate).toBe(transactionData.postingDate);
      expect(result.transactionDate).toBe(transactionData.transactionDate);
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

      expect(mockTransactionRepository.rootSave).toHaveBeenCalled();

      const savedTransaction = mockTransactionRepository.rootSave.mock
        .calls[0][1] as unknown as Transaction;

      const savedUserId = mockTransactionRepository.rootSave.mock
        .calls[0][0] as unknown as User;

      expect(savedUserId).toBe(user.getId().valueOf());

      expect(savedTransaction.getPostingDate().valueOf()).toBe(
        transactionData.postingDate,
      );
      expect(savedTransaction.getTransactionDate().valueOf()).toBe(
        transactionData.transactionDate,
      );
      expect(savedTransaction.getEntries().length).toBe(
        transactionDTO.entries.length,
      );

      expect(savedTransaction.description).toBe(transactionData.description);

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
