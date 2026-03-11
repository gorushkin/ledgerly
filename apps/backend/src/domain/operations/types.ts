import { IsoDatetimeString, MoneyString, UUID } from '@ledgerly/shared/types';

import { Account } from '../accounts';
import { Amount, Id } from '../domain-core';

export type OperationSnapshot = {
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  isTombstone: boolean;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  isSystem: boolean;
  accountId: UUID;
  amount: MoneyString;
  value: MoneyString;
  transactionId: UUID;
};

// TODO: consider moving this type to the service layer
export type OperationDraft = {
  accountId: UUID;
  amount: MoneyString;
  value: MoneyString;
  description: string;
};

// TODO: consider moving this type to the service layer
export type OperationUpdate = {
  id: UUID;
  accountId: UUID;
  amount: MoneyString;
  value: MoneyString;
  description: string;
};

export type OperationProps = {
  account: Account;
  amount: Amount;
  description: string;
  value: Amount;
};

export type UpdateOperationProps = OperationProps & {
  id: Id;
};

export type CreateOperationProps = OperationProps;
