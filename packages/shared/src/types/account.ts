import { CurrencyCode, IsoDatetimeString, UUID } from "./types";

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense";

export type AccountDomain = {
  createdAt: IsoDatetimeString;
  currency: CurrencyCode;
  currentClearedBalanceLocal: number;
  description: string;
  id: UUID;
  initialBalance: number;
  name: string;
  type: AccountType;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type AccountCreateDTO = {
  currency: CurrencyCode;
  description: string;
  initialBalance: number;
  name: string;
  type: AccountType;
  userId: UUID;
};

export type AccountUpdateDTO = Partial<
  Pick<AccountCreateDTO, "name" | "description" | "type" | "currency">
>;

export type AccountResponseDTO = AccountDomain;
