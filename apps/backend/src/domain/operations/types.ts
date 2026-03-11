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
