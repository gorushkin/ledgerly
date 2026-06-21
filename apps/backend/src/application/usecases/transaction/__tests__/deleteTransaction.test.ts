import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils/testEntityBuilder';
import { Transaction, User } from 'src/domain';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteTransactionUseCase } from '../DeleteTransaction';

describe('DeleteTransactionUseCase', () => {
  let user: User;
  let transaction: Transaction;

  const mockTransactionRepository = {
    getById: vi.fn(),
    softDelete: vi.fn(),
  };

  const transactionManager = {
    run: vi.fn((cb: () => unknown) => cb()),
  };

  const mockEnsureEntityExistsAndOwned = vi.fn();

  const deleteTransactionByIdUseCase = new DeleteTransactionUseCase(
    transactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    mockEnsureEntityExistsAndOwned,
  );

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
          amount: '10000',
          description: 'From Operation',
          value: '10000',
        },
        {
          accountKey: 'EUR',
          amount: '-10000',
          description: 'To Operation',
          value: '-10000',
        },
      ],
      user,
    });

    const predefinedTransaction = data.transaction;

    transaction = predefinedTransaction;
  });

  it('should delete transaction by ID', async () => {
    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);

    await deleteTransactionByIdUseCase.execute(
      user,
      transaction.getId().valueOf(),
    );

    expect(mockTransactionRepository.softDelete).toHaveBeenCalledWith(
      user.getId().valueOf(),
      transaction,
    );
  });

  it('should propagate error when transaction is not found', async () => {
    mockEnsureEntityExistsAndOwned.mockRejectedValue(
      new EntityNotFoundError({
        entityId: transaction.getId().valueOf(),
        entityType: Transaction.entityType,
      }),
    );

    const result = deleteTransactionByIdUseCase.execute(
      user,
      transaction.getId().valueOf(),
    );

    await expect(result).rejects.toThrow(EntityNotFoundError);

    await expect(result).rejects.toMatchObject({
      code: 'ENTITY_NOT_FOUND',
      context: {
        entityId: transaction.getId().valueOf(),
        entityType: Transaction.entityType,
      },
    });

    expect(mockTransactionRepository.softDelete).not.toHaveBeenCalled();
  });

  it('should propagate error when user does not own the transaction', async () => {
    mockEnsureEntityExistsAndOwned.mockRejectedValue(
      new UnauthorizedAccessError({
        entityId: transaction.getId().valueOf(),
        entityType: Transaction.entityType,
      }),
    );

    const result = deleteTransactionByIdUseCase.execute(
      user,
      transaction.getId().valueOf(),
    );

    await expect(result).rejects.toThrow(UnauthorizedAccessError);

    await expect(result).rejects.toMatchObject({
      code: 'UNAUTHORIZED_ACCESS',
      context: {
        entityId: transaction.getId().valueOf(),
        entityType: Transaction.entityType,
      },
    });

    expect(mockTransactionRepository.softDelete).not.toHaveBeenCalled();
  });

  it('should be idempotent — calling delete on already-deleted transaction should not re-mark or re-increment version', async () => {
    mockEnsureEntityExistsAndOwned.mockResolvedValue(transaction);

    const initialVersion = transaction.getVersion().valueOf();

    await deleteTransactionByIdUseCase.execute(
      user,
      transaction.getId().valueOf(),
    );

    const versionAfterFirstDelete = transaction.getVersion().valueOf();

    await deleteTransactionByIdUseCase.execute(
      user,
      transaction.getId().valueOf(),
    );

    expect(transaction.isDeleted()).toBe(true);
    expect(versionAfterFirstDelete).toBe(initialVersion + 1);
    expect(transaction.getVersion().valueOf()).toBe(versionAfterFirstDelete);
    expect(mockTransactionRepository.softDelete).toHaveBeenCalledTimes(1);
  });
});
