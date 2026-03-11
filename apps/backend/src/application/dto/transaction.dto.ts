import {
  CurrencyCode,
  IsoDateString,
  IsoDatetimeString,
  UUID,
} from '@ledgerly/shared/types';

import {
  CreateOperationRequestDTO,
  OperationResponseDTO,
  UpdateOperationRequestDTO,
} from './operation.dto';

// Request DTOs for creation
export type CreateTransactionRequestDTO = {
  description: string;
  operations: CreateOperationRequestDTO[];
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  currencyCode: CurrencyCode;
};

// Request DTOs for updating
export type UpdateTransactionRequestDTO = {
  description: string;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  operations: {
    create: CreateOperationRequestDTO[];
    update: UpdateOperationRequestDTO[];
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
  operations: OperationResponseDTO[];
  currency: CurrencyCode;
};
