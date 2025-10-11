import { IsoDateString, IsoDatetimeString, UUID } from '@ledgerly/shared/types';

import { CreateEntryRequestDTO, EntryResponseDTO } from './entry.dto';

export type TransactionDomain = {
  createdAt: IsoDatetimeString;
  description: string | null;
  id: UUID;
  isTombstone: boolean;
  postingDate: IsoDateString | null;
  transactionDate: IsoDateString;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

// Request DTOs для создания
export type CreateTransactionRequestDTO = {
  description: string;
  entries: CreateEntryRequestDTO[];
};

// Request DTOs для обновления
export type UpdateTransactionRequestDTO = {
  description?: string;
};

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

export type GetTransactionsQueryDTO = {
  userId: UUID;
  limit?: number;
  offset?: number;
  fromDate?: Date;
  toDate?: Date;
  accountId?: UUID;
};
