import {
  AccountTypeValue,
  IsoDatetimeString,
  UUID,
} from '@ledgerly/shared/types';

import { Id, Name } from '../domain-core';

import { AccountType } from './account-type.enum';

export type AccountSnapshot = {
  createdAt: IsoDatetimeString;
  commodityId: UUID;
  description: string;
  id: UUID;
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
  name: Name;
  type: AccountType;
};
