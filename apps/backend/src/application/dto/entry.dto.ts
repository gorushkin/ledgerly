import { UUID } from '@ledgerly/shared/types';

import {
  CreateOperationRequestDTO,
  OperationResponseDTO,
} from './operation.dto';

// Request DTOs for creation

export type CreateEntryRequestDTO = {
  description?: string;
  operations: CreateOperationRequestDTO[];
};

// Request DTOs for updating

export type UpdateEntryRequestDTO = {
  description?: string;
};

// Response DTOs

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

// Query DTOs

export type GetEntriesQueryDTO = {
  transactionId: UUID;
};
