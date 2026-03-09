import { IsoDateString, IsoDatetimeString, UUID } from '@ledgerly/shared/types';
import { Currency } from 'src/domain/domain-core';

import {
  CreateEntryRequestDTO,
  EntryResponseDTO,
  UpdateEntryRequestDTO,
} from './entry.dto';
import { CreateOperationRequestDTO } from './operation.dto';

// Request DTOs for creation
export type CreateTransactionRequestDTO = {
  description: string;
  operations: CreateOperationRequestDTO[];
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  currency: Currency;
};

// Request DTOs for updating
export type UpdateTransactionRequestDTO = {
  description: string;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  entries?: {
    create: CreateEntryRequestDTO[];
    update: UpdateEntryRequestDTO[];
    delete: UUID[];
  };
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
