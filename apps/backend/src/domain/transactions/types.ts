import {
  IsoDateString,
  UUID,
  CurrencyCode,
  IsoDatetimeString,
} from '@ledgerly/shared/types';

import { Account } from '../accounts';
import { Currency, DateValue, Id } from '../domain-core';
import {
  CreateOperationProps,
  OperationProps,
  OperationSnapshot,
  UpdateOperationProps,
} from '../operations/types';

export type TransactionUpdateData = {
  description: string;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
};

export type TransactionBuildContext = {
  accountsMap: Map<UUID, Account>;
  systemAccountsMap: Map<CurrencyCode, Account>;
};

export type CreateTransactionProps = {
  description: string;
  postingDate: DateValue;
  transactionDate: DateValue;
  operations: OperationProps[];
  currency: Currency;
};

export type OperationsPatch = {
  create: CreateOperationProps[];
  update: UpdateOperationProps[];
  delete: Id[];
} | null;

export type UpdateTransactionProps = {
  metadata?: TransactionUpdateData;
  operations?: OperationsPatch;
};

export type TransactionSnapshot = {
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  isTombstone: boolean;
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  operations: OperationSnapshot[];
  version: number;
  currency: CurrencyCode;
};

export type TransactionWithEntriesAndOperations = TransactionSnapshot & {
  operations: OperationSnapshot[];
};
