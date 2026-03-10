import { IsoDatetimeString, MoneyString, UUID } from '@ledgerly/shared/types';

// Request DTOs for creation

export type OperationRequestDTO = {
  accountId: UUID;
  amount: MoneyString;
  value: MoneyString;
  description: string;
  transactionId: UUID;
};

export type CreateOperationRequestDTO = OperationRequestDTO;

// Request DTOs for updating

export type UpdateOperationRequestDTO = OperationRequestDTO & {
  transactionId: UUID;
  id: UUID;
};

// Response DTOs

export type OperationResponseDTO = {
  id: UUID;
  transactionId: UUID;
  accountId: UUID;
  amount: MoneyString;
  value: MoneyString;
  description?: string;
  createdAt: IsoDatetimeString;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  isSystem: boolean;
};

// Query DTOs
