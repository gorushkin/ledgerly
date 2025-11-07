import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';

import {
  CreateOperationRequestDTO,
  OperationResponseDTO,
} from './operation.dto';

// Request DTOs for creation

export type EntryOperations = {
  from: CreateOperationRequestDTO;
  to: CreateOperationRequestDTO;
};

export type CreateEntryRequestDTO = EntryOperations;

// Request DTOs for updating

// Response DTOs

export type EntryResponseDTO = {
  id: UUID;
  transactionId: UUID;
  createdAt: IsoDatetimeString;
  updatedAt: IsoDatetimeString;
  operations: OperationResponseDTO[];
};

// Query DTOs

export type GetEntriesQueryDTO = {
  transactionId: UUID;
};
