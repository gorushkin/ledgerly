import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';

import {
  CreateOperationRequestDTO,
  OperationResponseDTO,
  UpdateOperationRequestDTO,
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

export type UpdateEntryRequestDTO = {
  id: UUID;
  operations: [UpdateOperationRequestDTO, UpdateOperationRequestDTO];
};

// Response DTOs

export type EntryResponseDTO = {
  id: UUID;
  transactionId: UUID;
  createdAt: IsoDatetimeString;
  updatedAt: IsoDatetimeString;
  operations: EntryOperationsResponseDTO;
  isTombstone: boolean;
  userId: UUID;
};

// Query DTOs

export type GetEntriesQueryDTO = {
  transactionId: UUID;
};

// TODO: remove after testing git
export type TEST = string;
export type TEST20 = string;
export type TEST30 = string;
export type TEST40 = string;
