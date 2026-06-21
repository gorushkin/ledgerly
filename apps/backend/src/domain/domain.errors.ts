import { apiErrorCodes, UUID } from '@ledgerly/shared/types';
import { BaseError, CodedError } from 'src/shared/errors';

import { Amount } from './domain-core/value-objects/Amount';
import {
  MIN_TRANSACTION_OPERATIONS,
  MAX_TRANSACTION_OPERATIONS,
} from './transactions/constants';

/**
 * Base class for all domain layer errors.
 * Domain errors represent violations of business rules and invariants.
 */
export class DomainError extends BaseError {}

/**
 * Thrown when a version value is not a non-negative integer.
 */
export class InvalidVersionError extends CodedError<'INVALID_VERSION'> {
  constructor(public readonly value: number) {
    super(
      'version must be a non-negative integer',
      apiErrorCodes.invalidVersion,
      {
        reason: 'NON_NEGATIVE_INTEGER',
        received: value,
      },
    );
  }
}

/**
 * Thrown when a money amount value is not a valid integer minor-unit amount.
 */
export class InvalidAmountError extends CodedError<'INVALID_AMOUNT'> {
  constructor(public readonly value: unknown) {
    super(
      'money value must be a valid integer minor-unit value',
      apiErrorCodes.invalidAmount,
      {
        reason: 'NOT_INTEGER_MINOR_UNITS',
        received: String(value),
      },
    );
  }
}

/**
 * Thrown when a transaction's operations don't balance (sum !== 0).
 */
export class UnbalancedTransactionError extends CodedError<'TRANSACTION_UNBALANCED'> {
  constructor(
    entityType: string,
    public readonly transactionId: UUID,
    public readonly difference: Amount,
  ) {
    super(
      `operations are unbalanced; difference: ${difference.valueOf()}`,
      apiErrorCodes.transactionUnbalanced,
      {
        difference: difference.valueOf(),
        entityType,
        transactionId,
      },
    );
  }
}

/**
 * Thrown when attempting to add an empty operations array to an entry.
 */
export class EmptyOperationsError extends CodedError<'EMPTY_OPERATIONS'> {
  constructor() {
    super(
      'cannot add an empty operations array',
      apiErrorCodes.emptyOperations,
      {},
    );
  }
}

/**
 * Thrown when a transaction contains fewer than two operations.
 */
export class InsufficientOperationsError extends CodedError<'INSUFFICIENT_OPERATIONS'> {
  constructor(public readonly operationCount: number) {
    super(
      `too few operations: expected at least ${MIN_TRANSACTION_OPERATIONS}, received ${operationCount}`,
      apiErrorCodes.insufficientOperations,
      {
        minimum: MIN_TRANSACTION_OPERATIONS,
        received: operationCount,
      },
    );
  }
}

/**
 * Thrown when a transaction contains more than the maximum allowed operations.
 */
export class ExcessiveOperationsError extends CodedError<'EXCESSIVE_OPERATIONS'> {
  constructor(public readonly operationCount: number) {
    super(
      `too many operations: expected at most ${MAX_TRANSACTION_OPERATIONS}, received ${operationCount}`,
      apiErrorCodes.excessiveOperations,
      {
        maximum: MAX_TRANSACTION_OPERATIONS,
        received: operationCount,
      },
    );
  }
}

/**
 * Thrown when attempting to perform operations on a deleted entity.
 */
type DeletedEntityOperation = 'update';

export class DeletedEntityOperationError extends DomainError {
  constructor(entityType: string, operation: DeletedEntityOperation) {
    super(`Cannot ${operation} on deleted ${entityType}`);
  }

  static forUpdate(entityType: string): DeletedEntityOperationError {
    return new DeletedEntityOperationError(entityType, 'update');
  }
}

/**
 * Thrown when an operation doesn't belong to the expected transaction.
 */
export class OperationOwnershipError extends DomainError {
  constructor() {
    super('Operation does not belong to this transaction');
  }
}

/**
 * Thrown when attempting to validate an entry without operations.
 */
export class MissingOperationsError extends DomainError {
  constructor() {
    super('Cannot validate entry without operations');
  }
}

/**
 * Thrown when the same operation ID appears in multiple patch arrays simultaneously.
 */
export class ConflictingOperationIdsError extends DomainError {
  constructor(
    public readonly conflictingIds: string[],
    public readonly conflictType: string,
  ) {
    super(
      `Operation IDs cannot appear in multiple operations. ${conflictType}: ${conflictingIds.join(', ')}`,
    );
  }
}

/**
 * Thrown when attempting to update/delete an operation that doesn't belong to the transaction.
 */
export class OperationNotFoundInTransactionError extends DomainError {
  constructor(
    public readonly operationId: UUID,
    public readonly transactionId: UUID,
  ) {
    super(
      `Operation with id ${operationId} does not belong to transaction ${transactionId}`,
    );
  }
}

/**
 * Thrown when attempting to attach an entry that doesn't belong to this transaction.
 * This indicates a programming error - operations should be created with correct transactionId.
 */
export class OperationDoesNotBelongToTransactionError extends DomainError {
  constructor(
    public readonly operationId: UUID,
    public readonly transactionId: UUID,
  ) {
    super(
      `Operation with id ${operationId} was created with wrong transactionId. Expected: ${transactionId}`,
    );
  }
}

/**
 * Thrown when an account required for an operation is not found in the transaction build context.
 */
export class AccountNotFoundInContextError extends DomainError {
  constructor(
    public readonly accountId: string,
    public readonly operationId: string,
  ) {
    super(
      `Account with ID ${accountId} not found in context for operation ${operationId}`,
    );
  }
}

/**
 * Thrown when an operation belongs to a different user than the transaction it's being attached to.
 * This indicates a programming error - operations should be created with the same userId as the transaction.
 */
export class OperationUserMismatchError extends DomainError {
  constructor(
    public readonly operationId: UUID,
    public readonly transactionId: UUID,
  ) {
    super(
      `Operation ${operationId} does not belong to the same user as transaction ${transactionId}`,
    );
  }
}

/**
 * Thrown when TransactionBuildContext is required but not provided.
 */
export class MissingTransactionContextError extends DomainError {
  constructor(operation: string) {
    super(`TransactionBuildContext is required to ${operation}`);
  }
}
