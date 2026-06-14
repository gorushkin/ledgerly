import { z } from "zod";

import { getTransactionsQuerySchema } from "../validation/baseValidations";

import type { PaginatedResponse } from "./pagination";
import type {
  CurrencyCode,
  IsoDateString,
  IsoDatetimeString,
  MoneyString,
  UUID,
} from "./types";

export type TransactionQueryInput = z.input<typeof getTransactionsQuerySchema>;
export type TransactionQueryParams = z.output<
  typeof getTransactionsQuerySchema
>;

export type OperationRequestDTO = {
  accountId: UUID;
  amount: MoneyString;
  description: string;
  value: MoneyString;
};

export type CreateOperationRequestDTO = OperationRequestDTO;

export type UpdateOperationRequestDTO = OperationRequestDTO & {
  id: UUID;
};

export type OperationResponseDTO = {
  accountId: UUID;
  amount: MoneyString;
  createdAt: IsoDatetimeString;
  description?: string;
  id: UUID;
  isSystem: boolean;
  transactionId: UUID;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  value: MoneyString;
};

export type CreateTransactionRequestDTO = {
  currencyCode: CurrencyCode;
  description: string;
  operations: CreateOperationRequestDTO[];
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
};

export type UpdateTransactionRequestDTO = {
  description: string;
  operations: {
    create: CreateOperationRequestDTO[];
    delete: UUID[];
    update: UpdateOperationRequestDTO[];
  };
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  version: number;
};

export type TransactionResponseDTO = {
  createdAt: IsoDatetimeString;
  currency: CurrencyCode;
  description: string;
  id: UUID;
  operations: OperationResponseDTO[];
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  version: number;
};

export type TransactionListResponseDTO =
  PaginatedResponse<TransactionResponseDTO>;
