import { IsoDatetimeString, AmountString, UUID, RequiredText } from "./types";

export type AccountTypeValue =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "currencyTrading"
  | "expense";

export type AccountCreateDTO = {
  commodityId: UUID;
  description: string;
  initialBalance: AmountString;
  name: string;
  type: AccountTypeValue;
};

export type AccountUpdateDTO = Partial<
  Pick<AccountCreateDTO, "name" | "description" | "type">
>;

export type AccountResponseDTO = {
  commodityId: UUID;
  createdAt: IsoDatetimeString;
  currentClearedBalanceLocal: AmountString;
  description: string;
  id: UUID;
  initialBalance: AmountString;
  isClosed: boolean;
  isSystem: boolean;
  isTombstone: boolean;
  name: RequiredText;
  type: AccountTypeValue;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};
