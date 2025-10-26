import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';

import { CreateOperationRequestDTO } from './operation.dto';

// Request DTOs for creation

export type CreateEntryRequestDTO = {
  operations: CreateOperationRequestDTO[];
};

// Request DTOs for updating

// Response DTOs

export type EntryResponseDTO = {
  id: UUID;
  transactionId: UUID;
  createdAt: IsoDatetimeString;
  updatedAt: IsoDatetimeString;
  // operations: OperationResponseDTO[];
  // isBalanced: boolean;
  // totalDebit: number;
  // totalCredit: number;
};

// Query DTOs

export type GetEntriesQueryDTO = {
  transactionId: UUID;
};
