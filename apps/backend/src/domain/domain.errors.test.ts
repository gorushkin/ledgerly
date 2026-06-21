import {
  EmptyOperationsError,
  ExcessiveOperationsError,
  InsufficientOperationsError,
  InvalidVersionError,
} from 'src/domain/domain.errors';
import {
  MAX_TRANSACTION_OPERATIONS,
  MIN_TRANSACTION_OPERATIONS,
} from 'src/domain/transactions/constants';
import { describe, expect, it } from 'vitest';

describe('coded domain errors', () => {
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
});
