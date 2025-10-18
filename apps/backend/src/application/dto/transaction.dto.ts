import { IsoDateString, IsoDatetimeString, UUID } from '@ledgerly/shared/types';

// Request DTOs for creation
export type CreateTransactionRequestDTO = {
  description: string;
  // entries: CreateEntryRequestDTO[];
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
};

// Request DTOs for updating
export type UpdateTransactionRequestDTO = {
  description?: string;
};

export type TransactionResponseDTO = {
  id: UUID;
  userId: UUID;
  description: string;
  createdAt: IsoDatetimeString;
  updatedAt: IsoDatetimeString;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  // entries: EntryResponseDTO[];
};

export type GetTransactionsQueryDTO = {
  userId: UUID;
  limit?: number;
  offset?: number;
  fromDate?: Date;
  toDate?: Date;
  accountId?: UUID;
};
