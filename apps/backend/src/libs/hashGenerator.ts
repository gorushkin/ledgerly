import { createHash } from 'node:crypto';

import { TransactionDbRecordDTO } from '@ledgerly/shared/types';

export const sha256Sync = (input: string): string => {
  return createHash('sha256').update(input).digest('hex');
};

const stringifyObjectByFields = <T>(obj: T, fields: (keyof T)[]) =>
  fields
    .map((field) => (obj[field] != null ? obj[field]?.toString() : ''))
    .join('|');

const objHashGenerator = <T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): string => {
  return sha256Sync(stringifyObjectByFields(obj, fields));
};

export const getTransactionWithHash = (
  transaction: Omit<TransactionDbRecordDTO, 'hash'>,
): TransactionDbRecordDTO => {
  return {
    ...transaction,
    hash: objHashGenerator(transaction, [
      'description',
      'postingDate',
      'transactionDate',
    ]),
  };
};
