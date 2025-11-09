import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';

import {
  CreateOperationRequestDTO,
  OperationResponseDTO,
} from './operation.dto';

// Request DTOs for creation

export type CreateEntryRequestDTO = [
  CreateOperationRequestDTO,
  CreateOperationRequestDTO,
];

export type EntryOperationsResponseDTO = [
  OperationResponseDTO,
  OperationResponseDTO,
];

// Request DTOs for updating

// Response DTOs

export type EntryResponseDTO = {
  id: UUID;
  transactionId: UUID;
  createdAt: IsoDatetimeString;
  updatedAt: IsoDatetimeString;
  operations: EntryOperationsResponseDTO;
  userId: UUID;
};

// Query DTOs

export type GetEntriesQueryDTO = {
  transactionId: UUID;
};
