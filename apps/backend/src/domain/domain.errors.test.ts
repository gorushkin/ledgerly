import {
  DeletedEntityOperationError,
  EmptyOperationsError,
  ExcessiveOperationsError,
  InsufficientOperationsError,
  InvalidVersionError,
  OperationDoesNotBelongToTransactionError,
  OperationNotFoundInTransactionError,
  OperationUserMismatchError,
} from 'src/domain/domain.errors';
import {
  MAX_TRANSACTION_OPERATIONS,
  MIN_TRANSACTION_OPERATIONS,
} from 'src/domain/transactions/constants';
import { describe, expect, it } from 'vitest';

describe('coded domain errors', () => {
  it('exposes DELETED_ENTITY_OPERATION context', () => {
    expect(
      new DeletedEntityOperationError('transaction', 'update'),
    ).toMatchObject({
      code: 'DELETED_ENTITY_OPERATION',
      context: {
        entityType: 'transaction',
        operation: 'update',
      },
    });
  });

  it('exposes INVALID_VERSION context', () => {
    expect(new InvalidVersionError(-1)).toMatchObject({
      code: 'INVALID_VERSION',
      context: {
        reason: 'NON_NEGATIVE_INTEGER',
        received: -1,
      },
    });
  });

  it('exposes EMPTY_OPERATIONS context', () => {
    expect(new EmptyOperationsError()).toMatchObject({
      code: 'EMPTY_OPERATIONS',
      context: {},
    });
  });

  it('exposes INSUFFICIENT_OPERATIONS context', () => {
    expect(new InsufficientOperationsError(1)).toMatchObject({
      code: 'INSUFFICIENT_OPERATIONS',
      context: {
        minimum: MIN_TRANSACTION_OPERATIONS,
        received: 1,
      },
    });
  });

  it('exposes EXCESSIVE_OPERATIONS context', () => {
    const received = MAX_TRANSACTION_OPERATIONS + 1;

    expect(new ExcessiveOperationsError(received)).toMatchObject({
      code: 'EXCESSIVE_OPERATIONS',
      context: {
        maximum: MAX_TRANSACTION_OPERATIONS,
        received,
      },
    });
  });

  it.each([
    [
      'OPERATION_NOT_FOUND_IN_TRANSACTION',
      new OperationNotFoundInTransactionError(
        'operation-id' as never,
        'transaction-id' as never,
      ),
    ],
    [
      'OPERATION_TRANSACTION_MISMATCH',
      new OperationDoesNotBelongToTransactionError(
        'operation-id' as never,
        'transaction-id' as never,
      ),
    ],
    [
      'OPERATION_USER_MISMATCH',
      new OperationUserMismatchError(
        'operation-id' as never,
        'transaction-id' as never,
      ),
    ],
  ])('exposes %s context', (code, error) => {
    expect(error).toMatchObject({
      code,
      context: {
        operationId: 'operation-id',
        transactionId: 'transaction-id',
      },
    });
  });
});
