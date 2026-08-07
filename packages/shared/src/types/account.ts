import { IsoDatetimeString, UUID, RequiredText } from "./types";

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
  name: string;
  type: AccountTypeValue;
};

export type AccountUpdateDTO = Partial<
  Pick<AccountCreateDTO, "name" | "description" | "type">
>;

export type AccountResponseDTO = {
  commodityId: UUID;
  createdAt: IsoDatetimeString;
  description: string;
  id: UUID;
  isClosed: boolean;
  isTombstone: boolean;
  name: RequiredText;
  type: AccountTypeValue;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};
