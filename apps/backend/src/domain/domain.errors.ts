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
