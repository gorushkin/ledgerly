import { UUID } from "./auth";
import { OperationCreateDTO, OperationResponseDTO } from "./operations";

type TransactionBaseDTO = {
  description: string;
  hash: string;
  id: UUID;
  postingDate: string;
  transactionDate: string;
  userId: UUID;
};

export type TransactionDbRecordDTO = TransactionBaseDTO;

export type TransactionDbRowDTO = TransactionBaseDTO & {
  createdAt: string;
  updatedAt: string;
};

export type TransactionDbPreHashDTO = Omit<TransactionDbRecordDTO, "hash">;

// transactions with operations

export type TransactionCreateDTO = TransactionBaseDTO & {
  operations: OperationCreateDTO[];
};

export type TransactionPreHashDTO = Omit<TransactionCreateDTO, "hash">;

export type TransactionUpdateDTO = TransactionCreateDTO;

export type TransactionResponseDTO = TransactionDbRowDTO & {
  operations: OperationResponseDTO[];
};
