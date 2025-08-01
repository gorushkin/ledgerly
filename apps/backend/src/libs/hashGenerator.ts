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

// export const getOperationWithHash = (
//   operation: OperationRaw,
// ): OperationCreateDTO => {
//   return {
//     ...operation,
//     hash: objHashGenerator(operation, [
//       'accountId',
//       'categoryId',
//       'description',
//       'localAmount',
//       'originalAmount',
//     ]),
//   };
// };

// export const getOperationsHash = (
//   operations: (OperationCreateDTO | OperationRaw)[],
// ): string => {
//   const sortedById = [...operations].sort((a, b) => a.id.localeCompare(b.id));

//   const hashes: string[] = [];

//   sortedById.forEach((operation) => {
//     if ('hash' in operation && typeof operation.hash === 'string') {
//       hashes.push(operation.hash);
//       return;
//     }

//     const hash = getOperationWithHash(operation).hash;
//     hashes.push(hash);
//   });

//   return sha256Sync(hashes.join('|'));
// };

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

// export const getAggregatedTransactionWithHash = (
//   transaction: TransactionPreHashDTO,
// ): TransactionCreateDTO => {
//   const operationsHash = getOperationsHash(transaction.operations);

//   const baseFields = [
//     transaction.description,
//     transaction.postingDate,
//     transaction.transactionDate,
//     transaction.userId,
//     operationsHash,
//   ];

//   const hash = sha256Sync(baseFields.join('|'));

//   return {
//     ...transaction,
//     hash,
//   };
// };
