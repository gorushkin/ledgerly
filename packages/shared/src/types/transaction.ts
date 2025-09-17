import { UUID } from "./auth";
import { EntryCreateDTO, EntryResponseDTO } from "./operation";
import { IsoDateString, IsoDatetimeString } from "./types";

type TransactionBaseDTO_DELETE = {
  description: string;
  hash: string;
  id: UUID;
  postingDate: string;
  transactionDate: string;
  userId: UUID;
};

export type TransactionDbInsertDTO_DELETE = TransactionBaseDTO_DELETE;

export type TransactionDbRowDTO_DELETE = TransactionBaseDTO_DELETE & {
  createdAt: string;
  updatedAt: string;
};

export type TransactionDbPreHashDTO_DELETE = Omit<
  TransactionDbInsertDTO_DELETE,
  "hash"
>;

export type TransactionCreateDTO_DELETE = TransactionBaseDTO_DELETE & {
  operations: EntryCreateDTO[];
};

export type TransactionPreHashDTO_DELETE = Omit<
  TransactionCreateDTO_DELETE,
  "hash"
>;

export type TransactionUpdateDTO_DELETE = Partial<
  Omit<TransactionBaseDTO_DELETE, "userId" | "balance">
> & {
  hash?: string;
  operations?: EntryCreateDTO[];
};

export type TransactionResponseDTO_DELETE = TransactionDbRowDTO_DELETE & {
  operations: EntryResponseDTO[];
};

// new types for db

export type TransactionDomain = {
  createdAt: IsoDatetimeString;
  description: string | null;
  id: UUID;
  isTombstone: boolean;
  postingDate: IsoDateString | null;
  transactionDate: IsoDateString;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type TransactionCreateDTO = {
  description: string;
  postingDate?: IsoDateString | null;
  transactionDate: IsoDateString;
  userId: UUID;
};

export type TransactionUpdateDTO = Partial<
  Pick<TransactionCreateDTO, "description" | "transactionDate" | "postingDate">
> & {
  id: UUID;
};
