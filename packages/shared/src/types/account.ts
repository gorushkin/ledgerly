import { UUID } from "./auth";
import { CurrencyCode, IsoDatetimeString } from "./types";

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense";

export type AccountDomain = {
  createdAt: IsoDatetimeString;
  currentClearedBalanceLocal: number;
  description: string;
  id: UUID;
  initialBalance: number;
  name: string;
  originalCurrency: CurrencyCode;
  type: AccountType;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type AccountCreateDTO = {
  description: string;
  initialBalance: number;
  name: string;
  originalCurrency: CurrencyCode;
  type: AccountType;
  userId: UUID;
};

export type AccountUpdateDTO = Partial<
  Pick<AccountCreateDTO, "name" | "description" | "type" | "originalCurrency">
>;

export type AccountResponseDTO = AccountDomain;
