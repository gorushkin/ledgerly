import {
  apiErrorCodes,
  type ApiErrorCode,
  type ErrorContextByCode,
  UUID,
} from '@ledgerly/shared/types';
import { BaseError } from 'src/shared/errors';

import { Amount } from './domain-core/value-objects/Amount';
import {
  MIN_TRANSACTION_OPERATIONS,
  MAX_TRANSACTION_OPERATIONS,
} from './transactions/constants';

/**
 * Base class for all domain layer errors.
 * Domain errors represent violations of business rules and invariants.
 */
export abstract class DomainError<
  Code extends ApiErrorCode = ApiErrorCode,
> extends BaseError {
  abstract readonly code: Code;
  abstract readonly context: ErrorContextByCode[Code];
}

/**
 * Base domain error with a stable, client-safe contract.
 */
export abstract class CodedDomainError<
  Code extends ApiErrorCode,
> extends DomainError<Code> {
  protected constructor(
    message: string,
    public readonly code: Code,
    public readonly context: ErrorContextByCode[Code],
    cause?: Error,
  ) {
    super(message, cause);
  }
}

/**
 * Thrown when a version value is not a non-negative integer.
 */
export class InvalidVersionError extends CodedDomainError<'INVALID_VERSION'> {
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
export class InvalidAmountError extends CodedDomainError<'INVALID_AMOUNT'> {
  constructor(
    public readonly value: unknown,
    cause?: Error,
  ) {
    super(
      'money value must be a valid integer minor-unit value',
      apiErrorCodes.invalidAmount,
      {
        reason: 'NOT_INTEGER_MINOR_UNITS',
        received: String(value),
      },
      cause,
    );
  }
}

export class InvalidDateError extends CodedDomainError<'INVALID_DATE'> {
  constructor(cause?: Error) {
    super(
      'date has an invalid format',
      apiErrorCodes.invalidDate,
      {
        reason: 'INVALID_FORMAT',
      },
      cause,
    );
  }
}

export class InvalidEmailError extends CodedDomainError<'INVALID_EMAIL'> {
  constructor() {
    super('email has an invalid format', apiErrorCodes.invalidEmail, {
      reason: 'INVALID_FORMAT',
    });
  }
}

export class InvalidMoneyAmountError extends CodedDomainError<'INVALID_MONEY_AMOUNT'> {
  constructor(cause?: Error) {
    super(
      'money amount must be an integer minor-unit value',
      apiErrorCodes.invalidMoneyAmount,
      {
        reason: 'INVALID_INTEGER_MINOR_UNITS',
      },
      cause,
    );
  }
}

export class InvalidIdentifierError extends CodedDomainError<'INVALID_IDENTIFIER'> {
  constructor(cause?: Error) {
    super(
      'identifier has an invalid format',
      apiErrorCodes.invalidIdentifier,
      {
        reason: 'INVALID_FORMAT',
      },
      cause,
    );
  }
}

export class InvalidNameError extends CodedDomainError<'INVALID_NAME'> {
  constructor() {
    super('name must not be empty', apiErrorCodes.invalidName, {
      reason: 'EMPTY',
    });
  }
}

export class InvalidPasswordError extends CodedDomainError<'INVALID_PASSWORD'> {
  constructor(cause?: Error) {
    super(
      'password does not meet the policy',
      apiErrorCodes.invalidPassword,
      {
        reason: 'POLICY_VIOLATION',
      },
      cause,
    );
  }
}

export class CurrencyMismatchError extends CodedDomainError<'CURRENCY_MISMATCH'> {
  constructor(
    public readonly expectedCurrency: string,
    public readonly receivedCurrency: string,
  ) {
    super(
      `currency ${receivedCurrency} does not match ${expectedCurrency}`,
      apiErrorCodes.currencyMismatch,
      { expectedCurrency, receivedCurrency },
    );
  }
}

export class InvalidAccountTypeError extends CodedDomainError<'INVALID_ACCOUNT_TYPE'> {
  constructor(public readonly receivedType: string) {
    super(
      `account type ${receivedType} is invalid`,
      apiErrorCodes.invalidAccountType,
      {
        receivedType,
      },
    );
  }
}

export class InvalidTimestampError extends CodedDomainError<'INVALID_TIMESTAMP'> {
  constructor(cause?: Error) {
    super(
      'timestamp has an invalid format',
      apiErrorCodes.invalidTimestamp,
      {
        reason: 'INVALID_FORMAT',
      },
      cause,
    );
  }
}

/**
 * Thrown when a transaction's operations don't balance (sum !== 0).
 */
export class UnbalancedTransactionError extends CodedDomainError<'TRANSACTION_UNBALANCED'> {
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
export class EmptyOperationsError extends CodedDomainError<'EMPTY_OPERATIONS'> {
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
export class InsufficientOperationsError extends CodedDomainError<'INSUFFICIENT_OPERATIONS'> {
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
export class ExcessiveOperationsError extends CodedDomainError<'EXCESSIVE_OPERATIONS'> {
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

export class DeletedEntityOperationError extends CodedDomainError<'DELETED_ENTITY_OPERATION'> {
  constructor(entityType: string, operation: DeletedEntityOperation) {
    super(
      `cannot ${operation} a deleted ${entityType}`,
      apiErrorCodes.deletedEntityOperation,
      { entityType, operation },
    );
  }

  static forUpdate(entityType: string): DeletedEntityOperationError {
    return new DeletedEntityOperationError(entityType, 'update');
  }
}

/**
 * Thrown when the same operation ID appears in multiple patch arrays simultaneously.
 */
type OperationIdConflict =
  | 'DUPLICATE_IN_DELETE'
  | 'DUPLICATE_IN_UPDATE'
  | 'UPDATE_AND_DELETE';

export class OperationAlreadyAttachedToTransactionError extends CodedDomainError<'OPERATION_ALREADY_ATTACHED_TO_TRANSACTION'> {
  constructor(
    public readonly operationId: UUID,
    public readonly transactionId: UUID,
  ) {
    super(
      `operation ${operationId} is already attached to transaction ${transactionId}`,
      apiErrorCodes.operationAlreadyAttachedToTransaction,
      { operationId, transactionId },
    );
  }
}

export class OperationIdMismatchError extends CodedDomainError<'OPERATION_ID_MISMATCH'> {
  constructor(
    public readonly expectedOperationId: UUID,
    public readonly receivedOperationId: UUID,
  ) {
    super(
      `operation ID ${receivedOperationId} does not match ${expectedOperationId}`,
      apiErrorCodes.operationIdMismatch,
      { expectedOperationId, receivedOperationId },
    );
  }
}

export class ConflictingOperationIdsError extends CodedDomainError<'CONFLICTING_OPERATION_IDS'> {
  constructor(
    public readonly conflictingIds: UUID[],
    public readonly conflict: OperationIdConflict,
  ) {
    super(
      `conflicting operation IDs: ${conflictingIds.join(', ')}`,
      apiErrorCodes.conflictingOperationIds,
      {
        conflict,
        operationIds: conflictingIds,
      },
    );
  }
}

/**
 * Thrown when attempting to update/delete an operation that doesn't belong to the transaction.
 */
export class OperationNotFoundInTransactionError extends CodedDomainError<'OPERATION_NOT_FOUND_IN_TRANSACTION'> {
  constructor(
    public readonly operationId: UUID,
    public readonly transactionId: UUID,
  ) {
    super(
      `operation ${operationId} was not found in transaction ${transactionId}`,
      apiErrorCodes.operationNotFoundInTransaction,
      { operationId, transactionId },
    );
  }
}

/**
 * Thrown when attempting to attach an entry that doesn't belong to this transaction.
 * This indicates a programming error - operations should be created with correct transactionId.
 */
export class OperationDoesNotBelongToTransactionError extends CodedDomainError<'OPERATION_TRANSACTION_MISMATCH'> {
  constructor(
    public readonly operationId: UUID,
    public readonly transactionId: UUID,
  ) {
    super(
      `operation ${operationId} belongs to a different transaction than ${transactionId}`,
      apiErrorCodes.operationTransactionMismatch,
      { operationId, transactionId },
    );
  }
}

/**
 * Thrown when an account required for an operation is not found in the transaction build context.
 */
export class AccountNotFoundInContextError extends CodedDomainError<'ACCOUNT_NOT_FOUND_IN_CONTEXT'> {
  constructor(
    public readonly accountId: string,
    public readonly operationId: string,
  ) {
    super(
      `account ${accountId} was not found in the transaction context`,
      apiErrorCodes.accountNotFoundInContext,
      { accountId, operationId },
    );
  }
}

/**
 * Thrown when an operation belongs to a different user than the transaction it's being attached to.
 * This indicates a programming error - operations should be created with the same userId as the transaction.
 */
export class OperationUserMismatchError extends CodedDomainError<'OPERATION_USER_MISMATCH'> {
  constructor(
    public readonly operationId: UUID,
    public readonly transactionId: UUID,
  ) {
    super(
      `operation ${operationId} and transaction ${transactionId} belong to different users`,
      apiErrorCodes.operationUserMismatch,
      { operationId, transactionId },
    );
  }
}

export class UserOwnershipError extends CodedDomainError<'UNAUTHORIZED_ACCESS'> {
  constructor(
    entityType: string,
    public readonly entityId: UUID,
  ) {
    super(
      `user ${entityId} does not match the authenticated user`,
      apiErrorCodes.unauthorizedAccess,
      {
        entityId,
        entityType,
      },
    );
  }
}
