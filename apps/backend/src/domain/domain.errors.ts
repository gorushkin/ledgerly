import { BaseError } from 'src/shared/errors/BaseError';

import { Amount } from './domain-core';
import { Entry } from './entries';

/**
 * Base class for all domain layer errors.
 * Domain errors represent violations of business rules and invariants.
 */
export class DomainError extends BaseError {}

/**
 * Thrown when an entry's operations don't balance (sum !== 0).
 */
export class UnbalancedEntryError extends DomainError {
  constructor(
    public readonly entry: Entry,
    public readonly difference: Amount,
  ) {
    super(
      `Entry with id ${entry.getId().valueOf()} has unbalanced operations. Difference: ${difference.valueOf()}`,
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
 * Thrown when an operation doesn't belong to the expected entry.
 */
export class OperationOwnershipError extends DomainError {
  constructor() {
    super('Operation does not belong to this entry');
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
 * Thrown when the same entry ID appears in multiple patch arrays simultaneously.
 */
export class ConflictingEntryIdsError extends DomainError {
  constructor(
    public readonly conflictingIds: string[],
    public readonly conflictType: string,
  ) {
    super(
      `Entry IDs cannot appear in multiple operations. ${conflictType}: ${conflictingIds.join(', ')}`,
    );
  }
}

/**
 * Thrown when attempting to update/delete an entry that doesn't belong to the transaction.
 */
export class EntryNotFoundInTransactionError extends DomainError {
  constructor(
    public readonly entryId: string,
    public readonly transactionId: string,
  ) {
    super(
      `Entry with id ${entryId} does not belong to transaction ${transactionId}`,
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
