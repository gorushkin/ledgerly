import { UUID } from "./auth";

type CategoryBaseDTO = {
  name: string;
  userId: UUID;
};

export type CategoryDBInsertDTO = CategoryBaseDTO;

export type CategoryDBUpdateDTO = Omit<CategoryBaseDTO, "userId">;

export type CategoryDBRowDTO = CategoryBaseDTO & {
  createdAt: string;
  id: UUID;
  updatedAt: string;
};

export type CategoryCreateDTO = CategoryBaseDTO;
export type CategoryResponseDTO = CategoryDBRowDTO;
export type CategoryUpdateDTO = CategoryDBUpdateDTO;
