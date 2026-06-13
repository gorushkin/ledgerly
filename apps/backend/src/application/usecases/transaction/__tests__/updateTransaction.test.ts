import type { UUID } from '@ledgerly/shared/types';
import { OperationMapper, TransactionMapper } from 'src/application';
import {
  CreateOperationRequestDTO,
  UpdateOperationRequestDTO,
  UpdateTransactionRequestDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionContextLoader } from 'src/application/services/TransactionService/transaction.context-loader';
import { createUser } from 'src/db/createTestUser';
import { compareEntities, TransactionBuilder } from 'src/db/test-utils';
import { Transaction, User } from 'src/domain';
import { Amount, Id } from 'src/domain/domain-core';
import {
  ConflictingOperationIdsError,
  OperationNotFoundInTransactionError,
  UnbalancedTransactionError,
} from 'src/domain/domain.errors';
import { TransactionBuildContext } from 'src/domain/transactions/types';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { UpdateTransactionUseCase } from '../UpdateTransaction';

describe('UpdateTransactionUseCase', () => {
  let user: User;
  let transaction: Transaction;
  let transactionContext: TransactionBuildContext;

  const mockTransactionManager = {
    run: vi.fn((cb: () => unknown) => cb()),
  };

  const mockTransactionRepository = {
    getById: vi.fn(),
    update: vi.fn(),
  } satisfies Partial<TransactionRepositoryInterface>;

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

  const createRequest = (
    overrides: Partial<UpdateTransactionRequestDTO> = {},
  ): UpdateTransactionRequestDTO => ({
    description: transaction.description,
    operations: {
      create: [],
      delete: [],
      update: [],
    },
    postingDate: transaction.getPostingDate().valueOf(),
    transactionDate: transaction.getTransactionDate().valueOf(),
    version: transaction.getVersion().valueOf(),
    ...overrides,
  });

  const createOperationRequest = (
    accountId: UUID,
    value: string,
    description: string,
  ): CreateOperationRequestDTO => ({
    accountId,
    amount: Amount.create(value).valueOf(),
    description,
    value: Amount.create(value).valueOf(),
  });

  const createUpdateOperationRequest = (
    operationIndex: number,
    value: string,
    description: string,
  ): UpdateOperationRequestDTO => {
    const operation = transaction.getOperations()[operationIndex];

    return {
      accountId: operation.getAccountId().valueOf(),
      amount: Amount.create(value).valueOf(),
      description,
      id: operation.getId().valueOf(),
      value: Amount.create(value).valueOf(),
    };
  };

  const execute = (data: UpdateTransactionRequestDTO) =>
    updateTransactionUseCase.execute(user, transaction.getId().valueOf(), data);

  const expectVersionIncrementedFrom = (initialVersion: number) => {
    expect(transaction.getVersion().valueOf()).toBe(initialVersion + 1);
  };

  const expectRejectedWithoutPersistence = async (
    data: UpdateTransactionRequestDTO,
    errorType: new (...args: never[]) => Error,
  ) => {
    const initialVersion = transaction.getVersion();

    await expect(execute(data)).rejects.toThrow(errorType);

    expect(transaction.getVersion()).toBe(initialVersion);
    expect(mockTransactionRepository.update).not.toHaveBeenCalled();
  };

  const expectUpdateDependencies = (data: UpdateTransactionRequestDTO) => {
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

    expect(mockTransactionRepository.update).toHaveBeenCalledExactlyOnceWith(
      user.getId().valueOf(),
      transaction,
    );
  };

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    const data = TransactionBuilder.create(user)
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

    transaction = data.transaction;
    transactionContext = data.transactionContext;

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);
    mockTransactionContextLoader.loadContext.mockResolvedValue(
      transactionContext,
    );
  });

  it('updates metadata without changing operations', async () => {
    const initialOperationResponses = transaction
      .getOperations()
      .map((operation) => OperationMapper.toResponseDTO(operation));

    const data = createRequest({
      description: 'Updated Transaction Description',
    });

    const initialVersion = transaction.getVersion().valueOf();
    const result = await execute(data);

    expect(result.description).toBe(data.description);
    expect(result.version).toBe(initialVersion + 1);
    expect(result.operations).toHaveLength(initialOperationResponses.length);

    initialOperationResponses.forEach((initialOperation) => {
      const resultOperation = result.operations.find(
        (operation) => operation.id === initialOperation.id,
      );

      expect(resultOperation).toBeDefined();
      compareEntities(resultOperation!, initialOperation);
    });

    expectVersionIncrementedFrom(initialVersion);
    expectUpdateDependencies(data);
  });

  it('creates operations without changing existing operations', async () => {
    const initialOperationIds = transaction
      .getOperations()
      .map((operation) => operation.getId().valueOf());

    const accountId = transaction.getOperations()[0].getAccountId().valueOf();

    const operationsToCreate = [
      createOperationRequest(accountId, '500', 'New Operation Split 1'),
      createOperationRequest(accountId, '-500', 'New Operation Split 2'),
    ];

    const data = createRequest({
      operations: {
        create: operationsToCreate,
        delete: [],
        update: [],
      },
    });

    const initialVersion = transaction.getVersion().valueOf();
    const result = await execute(data);

    expect(result.operations).toHaveLength(
      initialOperationIds.length + operationsToCreate.length,
    );

    initialOperationIds.forEach((id) => {
      expect(result.operations).toContainEqual(expect.objectContaining({ id }));
    });

    operationsToCreate.forEach((operation) => {
      expect(result.operations).toContainEqual(
        expect.objectContaining(operation),
      );
    });

    expectVersionIncrementedFrom(initialVersion);
    expectUpdateDependencies(data);
  });

  it('updates existing operations without changing their identities', async () => {
    const operationsToUpdate = [
      createUpdateOperationRequest(0, '12000', 'Updated debit operation'),
      createUpdateOperationRequest(1, '-12000', 'Updated credit operation'),
    ];

    const data = createRequest({
      operations: {
        create: [],
        delete: [],
        update: operationsToUpdate,
      },
    });

    const initialVersion = transaction.getVersion().valueOf();
    const result = await execute(data);

    expect(result.operations).toHaveLength(operationsToUpdate.length);

    operationsToUpdate.forEach((operation) => {
      expect(result.operations).toContainEqual(
        expect.objectContaining(operation),
      );
    });

    expectVersionIncrementedFrom(initialVersion);
    expectUpdateDependencies(data);
  });

  it('deletes operations from the active response', async () => {
    const operationIdsToDelete = transaction
      .getOperations()
      .map((operation) => operation.getId().valueOf());

    const data = createRequest({
      operations: {
        create: [],
        delete: operationIdsToDelete,
        update: [],
      },
    });

    const initialVersion = transaction.getVersion().valueOf();
    const result = await execute(data);

    expect(result.operations).toEqual([]);

    operationIdsToDelete.forEach((id) => {
      const deletedOperation = transaction
        .getAllOperations()
        .find((operation) => operation.getId().valueOf() === id);

      expect(deletedOperation).toBeDefined();
      expect(deletedOperation?.isDeleted()).toBe(true);
    });

    expectVersionIncrementedFrom(initialVersion);
    expectUpdateDependencies(data);
  });

  it('applies create, update, and delete operations in one request', async () => {
    const operationToUpdate = createUpdateOperationRequest(
      0,
      '9000',
      'Updated remaining operation',
    );

    const operationIdToDelete = transaction
      .getOperations()[1]
      .getId()
      .valueOf();

    const operationToCreate = createOperationRequest(
      transaction.getOperations()[1].getAccountId().valueOf(),
      '-9000',
      'Replacement operation',
    );

    const data = createRequest({
      description: 'Mixed patch',
      operations: {
        create: [operationToCreate],
        delete: [operationIdToDelete],
        update: [operationToUpdate],
      },
    });

    const initialVersion = transaction.getVersion().valueOf();
    const result = await execute(data);

    expect(result.description).toBe(data.description);
    expect(result.operations).toHaveLength(2);
    expect(result.operations).toContainEqual(
      expect.objectContaining(operationToUpdate),
    );

    expect(result.operations).toContainEqual(
      expect.objectContaining(operationToCreate),
    );

    expect(result.operations).not.toContainEqual(
      expect.objectContaining({ id: operationIdToDelete }),
    );

    expectVersionIncrementedFrom(initialVersion);
    expectUpdateDependencies(data);
  });

  it('does not persist when the request makes no changes', async () => {
    const data = createRequest();

    const initialTransactionResponse =
      TransactionMapper.toResponseDTO(transaction);
    const initialVersion = transaction.getVersion();

    const result = await execute(data);

    compareEntities(result, initialTransactionResponse);
    expect(transaction.getVersion()).toBe(initialVersion);

    expect(
      mockTransactionContextLoader.loadContext,
    ).toHaveBeenCalledExactlyOnceWith(user, []);

    expect(mockTransactionRepository.update).not.toHaveBeenCalled();
  });

  it('rejects an update for an operation outside the transaction', async () => {
    const unknownOperationId = Id.create().valueOf();

    const operationToUpdate = {
      ...createUpdateOperationRequest(0, '10000', 'Unknown operation'),
      id: unknownOperationId,
    };

    const data = createRequest({
      operations: {
        create: [],
        delete: [],
        update: [operationToUpdate],
      },
    });

    await expectRejectedWithoutPersistence(
      data,
      OperationNotFoundInTransactionError,
    );
  });

  it('rejects an update that leaves the transaction unbalanced', async () => {
    const unbalancedOperation = createUpdateOperationRequest(
      0,
      '12000',
      'Unbalanced operation',
    );

    const data = createRequest({
      operations: {
        create: [],
        delete: [],
        update: [unbalancedOperation],
      },
    });

    await expectRejectedWithoutPersistence(data, UnbalancedTransactionError);
  });

  it('rejects the same operation ID in update and delete', async () => {
    const operationToUpdate = createUpdateOperationRequest(
      0,
      '10000',
      'Conflicting operation',
    );

    const data = createRequest({
      operations: {
        create: [],
        delete: [operationToUpdate.id],
        update: [operationToUpdate],
      },
    });

    await expectRejectedWithoutPersistence(data, ConflictingOperationIdsError);
  });

  it('rejects duplicate operation IDs in update', async () => {
    const operationToUpdate = createUpdateOperationRequest(
      0,
      '10000',
      'Duplicate update',
    );

    const data = createRequest({
      operations: {
        create: [],
        delete: [],
        update: [operationToUpdate, { ...operationToUpdate }],
      },
    });

    await expectRejectedWithoutPersistence(data, ConflictingOperationIdsError);
  });

  it('rejects duplicate operation IDs in delete', async () => {
    const operationId = transaction.getOperations()[0].getId().valueOf();
    const data = createRequest({
      operations: {
        create: [],
        delete: [operationId, operationId],
        update: [],
      },
    });

    await expectRejectedWithoutPersistence(data, ConflictingOperationIdsError);
  });

  it.todo('should propagate error when transaction is not found');
  it.todo('should propagate error when user does not own the transaction');
  it.todo(
    '[LED-34] should throw a version conflict error when optimistic locking version mismatches',
  );
  it.todo(
    'should propagate error when update is called on a deleted transaction',
  );
});
