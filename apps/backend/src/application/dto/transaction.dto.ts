import { UUID } from '@ledgerly/shared/types';

// Request DTOs для создания транзакций
export type CreateTransactionRequestDTO = {
  description: string;
  entries: CreateEntryRequestDTO[];
};

export type CreateEntryRequestDTO = {
  description?: string;
  operations: CreateOperationRequestDTO[];
};

export type CreateOperationRequestDTO = {
  accountId: UUID;
  amount: number;
  description?: string;
};

// Request DTOs для обновления транзакций
export type UpdateTransactionRequestDTO = {
  description?: string;
};

export type UpdateEntryRequestDTO = {
  description?: string;
};

export type UpdateOperationRequestDTO = {
  accountId?: UUID;
  id: UUID;
  amount?: string;
  description?: string;
};

// Response DTOs
export type TransactionResponseDTO = {
  id: UUID;
  userId: UUID;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  entries: EntryResponseDTO[];
  isValid: boolean;
  totalAmount: number;
};

export type EntryResponseDTO = {
  id: UUID;
  transactionId: UUID;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  operations: OperationResponseDTO[];
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
};

export type OperationResponseDTO = {
  id: UUID;
  entryId: UUID;
  accountId: UUID;
  amount: number;
  type: 'debit' | 'credit';
  isSystem: boolean;
  description?: string;
  displayAmount: string;
};

// Query DTOs
export type GetTransactionsQueryDTO = {
  userId: UUID;
  limit?: number;
  offset?: number;
  fromDate?: Date;
  toDate?: Date;
  accountId?: UUID;
};
