import { UUID } from '@ledgerly/shared/types';

import { CreateEntryRequestDTO, EntryResponseDTO } from './entry.dto';

// Request DTOs for creation
export type CreateTransactionRequestDTO = {
  description: string;
  entries: CreateEntryRequestDTO[];
};

// Request DTOs for updating
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
