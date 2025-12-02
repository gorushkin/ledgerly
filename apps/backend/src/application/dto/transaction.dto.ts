import { IsoDateString, IsoDatetimeString, UUID } from '@ledgerly/shared/types';

import { CreateEntryRequestDTO, EntryResponseDTO } from './entry.dto';

// Request DTOs for creation
export type CreateTransactionRequestDTO = {
  description: string;
  entries: CreateEntryRequestDTO[];
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
};

// Request DTOs for updating
export type UpdateTransactionRequestDTO = {
  description?: string;
  postingDate?: IsoDateString;
  transactionDate?: IsoDateString;
  entries?: CreateEntryRequestDTO[];
};

export type TransactionResponseDTO = {
  id: UUID;
  userId: UUID;
  description: string;
  createdAt: IsoDatetimeString;
  updatedAt: IsoDatetimeString;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  entries: EntryResponseDTO[];
};
