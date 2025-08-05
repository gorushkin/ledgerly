import { UUID } from "./auth";

export type OperationBaseDTO = {
  accountId: UUID;
  categoryId: UUID;
  description: string;
  hash: string;
  id: UUID;
  localAmount: number;
  originalAmount: number;
};

export type OperationCreateDTO = OperationBaseDTO;

export type OperationRaw = Omit<OperationBaseDTO, "hash">;

export type OperationResponseDTO = OperationCreateDTO & {
  createdAt: string;
  updatedAt: string;
  userId: UUID;
};
