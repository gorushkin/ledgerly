import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils/testEntityBuilder';
import { Transaction, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core/value-objects/Amount';
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

  it.todo('should propagate error when transaction is not found');
  it.todo('should propagate error when user does not own the transaction');
  it.todo(
    'should be idempotent — calling delete on already-deleted transaction should not re-mark or re-increment version',
  );
});
