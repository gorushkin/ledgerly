import { IsoDatetimeString, MoneyString, UUID } from '@ledgerly/shared/types';

// Request DTOs for creation

export type CreateOperationRequestDTO = {
  accountId: UUID;
  amount: MoneyString;
  description: string;
};

// Request DTOs for updating

export type UpdateOperationRequestDTO = {
  accountId?: UUID;
  entryId?: UUID;
  id: UUID;
  amount?: string;
  description: string;
};

// Response DTOs

export type OperationResponseDTO = {
  id: UUID;
  entryId: UUID;
  accountId: UUID;
  amount: MoneyString;
  description?: string;
  createdAt: IsoDatetimeString;
  updatedAt: IsoDatetimeString;
};

// Query DTOs
