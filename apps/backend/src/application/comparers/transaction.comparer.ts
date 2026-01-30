import { Transaction } from 'src/domain';

import { UpdateTransactionRequestDTO } from '../dto';

export type TransactionCompareResult = 'updatedMetadata' | 'unchanged';

export const compareTransaction = (
  existing: Transaction,
  incoming: UpdateTransactionRequestDTO,
) => {
  if (existing.description !== incoming.description) {
    return 'updatedMetadata';
  }

  if (existing.getPostingDate().valueOf() !== incoming.postingDate) {
    return 'updatedMetadata';
  }

  if (existing.getTransactionDate().valueOf() !== incoming.transactionDate) {
    return 'updatedMetadata';
  }

  return 'unchanged';
};
