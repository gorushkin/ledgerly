import {
  CurrencyCode,
  IsoDateString,
  IsoDatetimeString,
  MoneyString,
  UUID,
} from '@ledgerly/shared/types';

export type OperationReadModel = {
  accountId: UUID;
  amount: MoneyString;
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  isSystem: boolean;
  transactionId: UUID;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  value: MoneyString;
};

export type TransactionReadModel = {
  createdAt: IsoDatetimeString;
  currency: CurrencyCode;
  description: string;
  id: UUID;
  operations: OperationReadModel[];
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  version: number;
};
