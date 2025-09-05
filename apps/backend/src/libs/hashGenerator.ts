import { createHash } from 'node:crypto';

import {} from '@ledgerly/shared/types';
import { OperationDbInsert, TransactionDbInsert } from 'src/db/schema';

const sha256Sync = (input: string): string => {
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

const TRANSACTION_HASH_FIELDS: (keyof Omit<TransactionDbInsert, 'hash'>)[] = [
  'description',
  'postingDate',
  'transactionDate',
];

const OPERATION_HASH_FIELDS: (keyof Omit<OperationDbInsert, 'hash'>)[] = [
  'accountId',
  'description',
  'isTombstone',
  'localAmount',
  'baseAmount',
  'rateBasePerLocal',
];

export const getTransactionHash = (
  transaction: Omit<TransactionDbInsert, 'hash'>,
): string => {
  return objHashGenerator(transaction, TRANSACTION_HASH_FIELDS);
};

export const computeOperationHash = (
  operation: Omit<OperationDbInsert, 'hash'>,
): string => {
  return objHashGenerator(operation, OPERATION_HASH_FIELDS);
};

export const getTransactionWithHash = (
  transaction: Omit<TransactionDbInsert, 'hash'>,
): TransactionDbInsert => {
  return {
    ...transaction,
    hash: getTransactionHash(transaction),
  };
};

const validateHash = <T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  actualHash: string,
): boolean => {
  const expected = objHashGenerator(obj, fields);
  return expected === actualHash;
};

export const validateTransactionHash = (tx: TransactionDbInsert): boolean => {
  return validateHash(tx, TRANSACTION_HASH_FIELDS, tx.hash);
};
