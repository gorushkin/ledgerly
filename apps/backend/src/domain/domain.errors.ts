import { BaseError } from 'src/shared/errors/BaseError';

import { Amount } from './domain-core';

/**
 * Base class for all domain layer errors.
 * Domain errors represent violations of business rules and invariants.
 */
export class DomainError extends BaseError {}

/**
 * Thrown when a transaction's operations don't balance (sum !== 0).
 */
export class UnbalancedTransactionError extends DomainError {
  constructor(
    public readonly transactionId: string,
    public readonly difference: Amount,
  ) {
    super(
      `Transaction with id ${transactionId} has unbalanced operations. Difference: ${difference.valueOf()}`,
    );
  }
}

/**
 * Thrown when attempting to add an empty operations array to an entry.
 */
export class EmptyOperationsError extends DomainError {
  constructor() {
    super('Cannot add empty operations array');
  }
}

/**
 * Thrown when attempting to perform operations on a deleted entity.
 */
export class DeletedEntityOperationError extends DomainError {
  constructor(entityType: string, operation: string) {
    super(`Cannot ${operation} on deleted ${entityType}`);
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
    public readonly operationId: string,
    public readonly transactionId: string,
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
    public readonly operationId: string,
    public readonly transactionId: string,
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
    public readonly operationId: string,
    public readonly transactionId: string,
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
