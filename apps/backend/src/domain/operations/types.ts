import { IsoDatetimeString, MoneyString, UUID } from '@ledgerly/shared/types';

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
  entryId: UUID;
};
