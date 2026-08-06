import {
  AccountTypeValue,
  IsoDatetimeString,
  AmountString,
  UUID,
} from '@ledgerly/shared/types';

import { Amount, Id, Name } from '../domain-core';

import { AccountType } from './account-type.enum';

export type AccountSnapshot = {
  createdAt: IsoDatetimeString;
  currentClearedBalanceLocal: AmountString;
  commodityId: UUID;
  description: string;
  id: UUID;
  initialBalance: AmountString;
  isSystem: boolean;
  isTombstone: boolean;
  isClosed: boolean;
  name: string;
  type: AccountTypeValue;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type AccountUpdateProps = Partial<{
  description: string;
  name: string;
  type: AccountTypeValue;
}>;

export type CreateAccountProps = {
  commodityId: Id;
  description: string;
  initialBalance: Amount;
  name: Name;
  type: AccountType;
};
