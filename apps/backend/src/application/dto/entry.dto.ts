import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';

import {
  CreateOperationRequestDTO,
  OperationResponseDTO,
} from './operation.dto';

export type EntryDomain = {
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  isTombstone: boolean;
  transactionId: UUID;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

// Request DTOs для создания

export type CreateEntryRequestDTO = {
  description?: string;
  operations: CreateOperationRequestDTO[];
};

// Request DTOs для обновления

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

// old

// export type EntryApplyDTO = {
//   credit: EntrySide;
//   debit: EntrySide;
//   description: string;
//   id?: UUID; // if not provided, it is a new operation
// };

// export type EntryCreateDTO = {
//   credit: EntrySide;
//   debit: EntrySide;
//   description: string;
// };

// export type EntryUpdateDTO = {
//   credit: EntrySide;
//   debit: EntrySide;
//   description: string;
// };

// export type EntryResponseDTO = EntryDomain;
