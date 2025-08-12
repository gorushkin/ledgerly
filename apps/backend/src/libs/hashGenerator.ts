import { createHash } from 'node:crypto';

import {
  OperationResponseDTO,
  TransactionDbInsertDTO,
} from '@ledgerly/shared/types';

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

const TRANSACTION_HASH_FIELDS: (keyof Omit<TransactionDbInsertDTO, 'hash'>)[] =
  ['description', 'postingDate', 'transactionDate'];

const OPERATION_HASH_FIELDS: (keyof Omit<OperationResponseDTO, 'hash'>)[] = [
  'accountId',
  'categoryId',
  'description',
  'id',
  'isTombstone',
  'localAmount',
  'originalAmount',
  'transactionId',
  'updatedAt',
];

export const getTransactionHash = (
  transaction: Omit<TransactionDbInsertDTO, 'hash'>,
): string => {
  return objHashGenerator(transaction, TRANSACTION_HASH_FIELDS);
};

export const getOperationHash = (
  operation: Omit<OperationResponseDTO, 'hash'>,
): string => {
  return objHashGenerator(operation, OPERATION_HASH_FIELDS);
};

export const getTransactionWithHash = (
  transaction: Omit<TransactionDbInsertDTO, 'hash'>,
): TransactionDbInsertDTO => {
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

export const validateTransactionHash = (
  tx: TransactionDbInsertDTO,
): boolean => {
  return validateHash(tx, TRANSACTION_HASH_FIELDS, tx.hash);
};

export const validateOperationHash = (op: OperationResponseDTO): boolean => {
  return validateHash(op, OPERATION_HASH_FIELDS, op.hash);
};
