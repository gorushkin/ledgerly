import { UUID } from '@ledgerly/shared/types';

// Request DTOs for creation

export type CreateOperationRequestDTO = {
  accountId: UUID;
  amount: number;
  description?: string;
};

// Request DTOs for updating

export type UpdateOperationRequestDTO = {
  accountId?: UUID;
  entryId?: UUID;
  id: UUID;
  amount?: string;
  description?: string;
};

// Response DTOs

export type OperationResponseDTO = {
  id: UUID;
  entryId: UUID;
  accountId: UUID;
  amount: number;
  type: 'debit' | 'credit';
  isSystem: boolean;
  description?: string;
  displayAmount: string;
};

// Query DTOs
