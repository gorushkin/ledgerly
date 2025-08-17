import { z } from "zod";

import {
  accountCreateSchema,
  accountResponseSchema,
  accountUpdateSchema,
} from "../validation";

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense";

import { UUID } from "./auth";
import { CurrencyCode, IsoDatetimeString } from "./types";

// DB-level representation of an account

export type AccountDbRow = {
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

export type AccountDbInsert = Omit<
  AccountDbRow,
  "id" | "createdAt" | "updatedAt" | "currentClearedBalanceLocal"
> & {
  currentClearedBalanceLocal?: number;
  id?: UUID;
};

export type AccountDbUpdate = Partial<
  Omit<AccountDbRow, "id" | "userId" | "createdAt" | "updatedAt">
>;

// Entity representation of an account, used in business logic

export type AccountEntity = {
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

// Service-level representation of an account, used in API responses and requests

export type AccountServiceCreate = {
  description: string;
  initialBalance: number;
  name: string;
  originalCurrency: CurrencyCode;
  type: AccountType;
  userId: UUID;
};

export type AccountServiceUpdate = Partial<
  Pick<AccountEntity, "name" | "description" | "type" | "originalCurrency">
>;

// DTOs for API responses and requests
export type AccountCreateDTO = z.infer<typeof accountCreateSchema>;

export type AccountUpdateDTO = z.infer<typeof accountUpdateSchema>;

export type AccountResponseDTO = z.infer<typeof accountResponseSchema>;
