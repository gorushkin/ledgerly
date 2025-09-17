import { UUID } from "./auth";
import { IsoDatetimeString } from "./types";

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type Money = Brand<number, "Money">;

export type PerIdStatus =
  | "deleted"
  | "already_deleted"
  | "restored"
  | "already_alive"
  | "updated"
  | "not_found";

export type EntrySide = {
  accountId: UUID;
  amount: Money;
};

export type EntryDomain = {
  createdAt: IsoDatetimeString;
  credit: EntrySide;
  debit: EntrySide;
  description: string;
  id: UUID;
  isTombstone: boolean;
  transactionId: UUID;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type EntryApplyDTO = {
  credit: EntrySide;
  debit: EntrySide;
  description: string;
  id?: UUID; // if not provided, it is a new operation
};

export type EntryCreateDTO = {
  credit: EntrySide;
  debit: EntrySide;
  description: string;
};

export type EntryUpdateDTO = {
  credit: EntrySide;
  debit: EntrySide;
  description: string;
};

export type EntryResponseDTO = EntryDomain;
