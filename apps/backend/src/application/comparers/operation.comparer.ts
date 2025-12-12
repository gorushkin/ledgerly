import { Operation } from 'src/domain';
import { Amount } from 'src/domain/domain-core';

import { UpdateOperationRequestDTO } from '../dto';

export type OperationsCompareResult = 'identical' | 'different';

// TODO: remove if unused
export const compareOperation = (
  existing: Operation,
  incoming: UpdateOperationRequestDTO,
): OperationsCompareResult => {
  const incomingAmount = Amount.fromPersistence(incoming.amount);

  if (!existing.amount.equals(incomingAmount)) {
    return 'different';
  }

  if (existing.description !== incoming.description) {
    return 'different';
  }

  if (!existing.getAccountId().equals(incoming.accountId)) {
    return 'different';
  }

  return 'identical';
};
