import type { UUID } from '@ledgerly/shared/types';
import { OperationMapper, TransactionMapper } from 'src/application';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
  VersionConflictError,
} from 'src/application/application.errors';
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
import { Amount, Id, Version } from 'src/domain/domain-core';
import {
  ConflictingOperationIdsError,
  DeletedEntityOperationError,
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
    const initialSnapshot = transaction.toSnapshot();

    await expect(execute(data)).rejects.toThrow(errorType);
    expect(transaction.toSnapshot()).toEqual(initialSnapshot);
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
      Version.create(data.version),
    );
  };

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    const data = TransactionBuilder.transaction({
      accounts: ['USD', 'EUR'],
      operations: [
        {
          accountKey: 'USD',
          amount: '-100000',
          description: 'From Operation',
          value: '-100000',
        },
        {
          accountKey: 'USD',
          amount: '60000',
          description: 'To Operation 1',
          value: '60000',
        },
        {
          accountKey: 'USD',
          amount: '30000',
          description: 'From Operation 2',
          value: '30000',
        },
        {
          accountKey: 'USD',
          amount: '10000',
          description: 'To Operation 3',
          value: '10000',
        },
        {
          accountKey: 'USD',
          amount: '-30000',
          description: 'From Operation 3',
          value: '-30000',
        },
        {
          accountKey: 'USD',
          amount: '30000',
          description: 'To Operation 3÷÷',
          value: '30000',
        },
      ],
      user,
    });

    transaction = data.transaction;
    transactionContext = data.transactionContext;

    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);
    mockTransactionContextLoader.loadContext.mockResolvedValue(
      transactionContext,
    );

    mockTransactionRepository.update.mockResolvedValue({ ok: true });
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
      createUpdateOperationRequest(1, '20000', 'Updated debit operation'),
      createUpdateOperationRequest(2, '70000', 'Updated credit operation'),
    ];

    const operationsLength = transaction.getOperations().length;

    const data = createRequest({
      operations: {
        create: [],
        delete: [],
        update: operationsToUpdate,
      },
    });

    const initialVersion = transaction.getVersion().valueOf();
    const result = await execute(data);

    expect(result.operations).toHaveLength(operationsLength);

    operationsToUpdate.forEach((operation) => {
      expect(result.operations).toContainEqual(
        expect.objectContaining(operation),
      );
    });

    expectVersionIncrementedFrom(initialVersion);
    expectUpdateDependencies(data);
  });

  it('deletes operations from the active response', async () => {
    const operationsCount = transaction.getOperations().length;

    const operationIdsToDelete = [
      transaction.getOperations()[operationsCount - 2].getId().valueOf(),
      transaction.getOperations()[operationsCount - 1].getId().valueOf(),
    ];

    const restOperations = transaction
      .getOperations()
      .filter(
        (operation) =>
          !operationIdsToDelete.includes(operation.getId().valueOf()),
      );

    const data = createRequest({
      operations: {
        create: [],
        delete: operationIdsToDelete,
        update: [],
      },
    });

    const initialVersion = transaction.getVersion().valueOf();
    const result = await execute(data);

    expect(result.operations).toEqual(
      restOperations.map((operation) =>
        OperationMapper.toResponseDTO(operation),
      ),
    );

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
    const operationsCount = transaction.getOperations().length;

    const operationToUpdate1 = createUpdateOperationRequest(
      1,
      '60000',
      'Updated remaining operation',
    );

    const operationIdToDelete = transaction
      .getOperations()[3]
      .getId()
      .valueOf();

    const operationToCreate = createOperationRequest(
      transaction.getOperations()[1].getAccountId().valueOf(),
      '10000',
      'Replacement operation',
    );

    const data = createRequest({
      description: 'Mixed patch',
      operations: {
        create: [operationToCreate],
        delete: [operationIdToDelete],
        update: [operationToUpdate1],
      },
    });

    const initialVersion = transaction.getVersion().valueOf();
    const result = await execute(data);

    expect(result.description).toBe(data.description);
    expect(result.operations).toHaveLength(operationsCount);
    expect(result.operations).toContainEqual(
      expect.objectContaining(operationToUpdate1),
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

  it('propagates an error when the transaction is not found', async () => {
    const data = createRequest({
      description: 'Unknown transaction',
    });

    mockEnsureEntityExistsAndOwned.mockRejectedValue(
      new EntityNotFoundError('Transaction'),
    );

    await expect(execute(data)).rejects.toThrow(EntityNotFoundError);

    expect(mockTransactionRepository.update).not.toHaveBeenCalled();
    expect(mockTransactionContextLoader.loadContext).not.toHaveBeenCalled();
  });

  it('propagates an error when user does not own the transaction', async () => {
    const data = createRequest({
      description: 'Unauthorized transaction update',
    });

    mockEnsureEntityExistsAndOwned.mockRejectedValue(
      new UnauthorizedAccessError('Transaction'),
    );

    await expect(execute(data)).rejects.toThrow(UnauthorizedAccessError);

    expect(mockTransactionRepository.update).not.toHaveBeenCalled();
    expect(mockTransactionContextLoader.loadContext).not.toHaveBeenCalled();
  });

  it('throws a version conflict error when request version is stale', async () => {
    const data = createRequest({
      description: 'Stale update',
      version: transaction.getVersion().increment().valueOf(),
    });

    const result = execute(data);

    await expect(result).rejects.toThrow(VersionConflictError);
    await expect(result).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
      expectedVersion: data.version,
      message: `Transaction version mismatch for expected version ${data.version}`,
    });

    expect(mockTransactionRepository.update).not.toHaveBeenCalled();
  });

  it('throws a version conflict error when the repository detects a concurrent update', async () => {
    const data = createRequest({
      description: 'Conflicting update',
    });

    mockTransactionRepository.update.mockResolvedValue({
      ok: false,
      reason: 'VERSION_CONFLICT',
    });

    await expect(execute(data)).rejects.toThrow(VersionConflictError);

    expect(mockTransactionRepository.update).toHaveBeenCalledExactlyOnceWith(
      user.getId().valueOf(),
      transaction,
      Version.create(data.version),
    );
  });

  it('throws an entity not found error when the transaction disappears before persistence', async () => {
    const data = createRequest({
      description: 'Update deleted concurrently',
    });

    mockTransactionRepository.update.mockResolvedValue({
      ok: false,
      reason: 'NOT_FOUND',
    });

    await expect(execute(data)).rejects.toThrow(EntityNotFoundError);
  });

  it('propagates an error when update is called on a deleted transaction', async () => {
    transaction.markAsDeleted();

    const data = createRequest({
      description: 'Must not update deleted transaction',
      version: transaction.getVersion().increment().valueOf(),
    });

    const deletedSnapshot = transaction.toSnapshot();

    await expect(execute(data)).rejects.toThrow(DeletedEntityOperationError);
    expect(transaction.toSnapshot()).toEqual(deletedSnapshot);
    expect(mockTransactionContextLoader.loadContext).not.toHaveBeenCalled();
    expect(mockTransactionRepository.update).not.toHaveBeenCalled();
  });
});
