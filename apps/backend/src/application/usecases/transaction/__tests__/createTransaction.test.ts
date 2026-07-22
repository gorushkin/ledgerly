import type {
  CommodityRepositoryInterface,
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionContextLoader } from 'src/application/services/TransactionService';
import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils/testEntityBuilder';
import { User, Transaction, Commodity } from 'src/domain';
import { CommodityCode } from 'src/domain/domain-core/value-objects/CommodityCode';
import { Name } from 'src/domain/domain-core/value-objects/Name';
import { UnbalancedTransactionError } from 'src/domain/domain.errors';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTransactionUseCase } from '../CreateTransaction';

describe('CreateTransactionUseCase', () => {
  let user: User;
  let commodity: Commodity;

  const mockTransactionRepository = {
    create: vi.fn(),
  };

  const transactionManager = {
    run: vi.fn((cb: () => unknown) => cb()),
  };

  const transactionContextLoader = {
    loadContext: vi.fn(),
  };

  const commodityRepository = {
    getById: vi.fn(),
  };

  const createTransactionUseCase = new CreateTransactionUseCase(
    transactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    transactionContextLoader as unknown as TransactionContextLoader,
    commodityRepository as unknown as CommodityRepositoryInterface,
  );

  const transactionData = {
    currencyCode: 'USD',
    description: 'Test transaction',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
  };

  const operationsData = [
    { accountKey: 'USD', amount: '10000', description: '1' },
    { accountKey: 'USD', amount: '-10000', description: '2' },
  ];

  beforeAll(async () => {
    user = await createUser();

    commodity = Commodity.create(
      user,
      Name.create('Test Commodity'),
      CommodityCode.create('TEST'),
      2,
      null,
    );
  });

  beforeEach(() => {
    vi.resetAllMocks();

    transactionManager.run.mockImplementation((cb: () => unknown) => cb());
    commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());
  });

  describe('execute', () => {
    it('should create a new transaction with entries successfully', async () => {
      const { transactionContext, transactionDTO } = TransactionBuilder.request(
        {
          accounts: ['USD'],
          commodity,
          operations: operationsData,
          settings: transactionData,
          user,
        },
      );

      transactionContextLoader.loadContext.mockResolvedValue(
        transactionContext,
      );

      const result = await createTransactionUseCase.execute(
        user,
        transactionDTO,
      );

      expect(result.postingDate).toBe(transactionData.postingDate);
      expect(result.transactionDate).toBe(transactionData.transactionDate);

      transactionDTO.operations.forEach((operation, index) => {
        const matchedOperation = result.operations[index];

        expect(matchedOperation.accountId).toBe(operation.accountId);
        expect(matchedOperation.amount).toBe(operation.amount);
        expect(matchedOperation.description).toBe(operation.description);
      });

      expect(transactionManager.run).toHaveBeenCalled();

      expect(mockTransactionRepository.create).toHaveBeenCalled();

      const savedTransaction = mockTransactionRepository.create.mock
        .calls[0][1] as unknown as Transaction;

      const savedUserId = mockTransactionRepository.create.mock
        .calls[0][0] as unknown as User;

      expect(savedUserId).toBe(user.getId().valueOf());

      expect(savedTransaction.getPostingDate().valueOf()).toBe(
        transactionData.postingDate,
      );

      expect(savedTransaction.getTransactionDate().valueOf()).toBe(
        transactionData.transactionDate,
      );

      expect(savedTransaction.getOperations().length).toBe(
        transactionDTO.operations.length,
      );

      expect(savedTransaction.description).toBe(transactionData.description);

      savedTransaction.getOperations().forEach((operation, index) => {
        const dtoOperation = transactionDTO.operations[index];

        expect(operation.description).toBe(dtoOperation.description);
        expect(operation.amount.valueOf()).toBe(dtoOperation.amount);
        expect(operation.value.valueOf()).toBe(dtoOperation.value);
        expect(operation.getAccountId().valueOf()).toBe(dtoOperation.accountId);
        expect(operation.getUserId().valueOf()).toBe(user.getId().valueOf());
      });

      expect(transactionContextLoader.loadContext).toHaveBeenCalledWith(
        user,
        transactionDTO.operations,
      );

      expect(result.id).toBe(savedTransaction.getId().valueOf());
      expect(result.userId).toBe(user.getId().valueOf());
      expect(result.currency).toBe(transactionData.currencyCode);
    });

    it('should propagate error when loadContext fails', async () => {
      const error = new Error('Account not found');
      transactionContextLoader.loadContext.mockRejectedValue(error);

      const { transactionDTO } = TransactionBuilder.request({
        accounts: ['USD'],
        commodity,
        operations: [],
        settings: transactionData,
        user,
      });

      await expect(
        createTransactionUseCase.execute(user, transactionDTO),
      ).rejects.toThrow(error);
    });

    it('should propagate error when rootSave fails', async () => {
      const dbError = new Error('Database error');
      mockTransactionRepository.create.mockRejectedValue(dbError);

      const { transactionContext, transactionDTO } = TransactionBuilder.request(
        {
          accounts: ['USD'],
          commodity,
          operations: operationsData,
          settings: transactionData,
          user,
        },
      );

      transactionContextLoader.loadContext.mockResolvedValue(
        transactionContext,
      );

      await expect(
        createTransactionUseCase.execute(user, transactionDTO),
      ).rejects.toThrow(dbError);
    });

    it('should throw UnbalancedTransactionError when operations do not sum to zero', async () => {
      const unbalancedOperations = [
        { accountKey: 'USD', amount: '10000', description: '1' },
        { accountKey: 'USD', amount: '5000', description: '2' },
      ];

      const { transactionContext, transactionDTO } = TransactionBuilder.request(
        {
          accounts: ['USD'],
          commodity,
          operations: unbalancedOperations,
          settings: transactionData,
          user,
        },
      );

      transactionContextLoader.loadContext.mockResolvedValue(
        transactionContext,
      );

      await expect(
        createTransactionUseCase.execute(user, transactionDTO),
      ).rejects.toThrow(UnbalancedTransactionError);
    });
  });
});
