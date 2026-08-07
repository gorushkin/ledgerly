import {
  IsoDateString,
  IsoDatetimeString,
  AmountString,
  UUID,
} from '@ledgerly/shared/types';

export type OperationReadModel = {
  accountId: UUID;
  amount: AmountString;
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  transactionId: UUID;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  value: AmountString;
};

export type TransactionReadModel = {
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  operations: OperationReadModel[];
  postingDate: IsoDateString;
  transactionDate: IsoDateString;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  commodityId: UUID;
  version: number;
};
