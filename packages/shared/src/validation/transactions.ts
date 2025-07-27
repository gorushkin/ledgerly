import { z } from "zod";

import { dateText, defaultText, uuid } from "./baseValidations";
import { operationCreateSchema, operationResponseSchema } from "./operations";

export const transactionCreateSchema = z.object({
  description: defaultText,
  operations: z.array(operationCreateSchema).refine((data) => {
    const transactionBalance = data.reduce(
      (acc, op) => acc + op.localAmount,
      0
    );
    return transactionBalance === 0;
  }),
  postingDate: dateText,
  transactionDate: dateText,
  userId: uuid,
});

/*
export const transactionCreateSchema = z.object({
  description: defaultText,
  transactionDate: z.string().date("Неверный формат даты"),
  postingDate: z.string().date("Неверный формат даты").optional(),
  operations: z.array(operationCreateSchema)
    .min(1, "Транзакция должна содержать минимум одну операцию")
    .max(20, "Слишком много операций в одной транзакции")
}).refine(
  (data) => {
    // Проверяем, что сумма операций сбалансирована для переводов
    const totalAmount = data.operations.reduce((sum, op) => sum + op.localAmount, 0);
    
    // Для простых операций (1 операция) баланс не нужен
    if (data.operations.length === 1) return true;
    
    // Для переводов сумма должна быть близка к 0 (учитываем погрешности округления)
    return Math.abs(totalAmount) < 0.01;
  },
  {
    message: "Сумма операций в переводе должна быть сбалансирована",
    path: ["operations"]
  }
);
*/

export const transactionUpdateSchema = z.object({
  description: defaultText.optional(),
  operations: z.array(operationCreateSchema).nonempty().optional(),
  postingDate: dateText.optional(),
  transactionDate: dateText.optional(),
});

export const transactionResponseSchema = z
  .object({
    id: uuid,
    operations: z.array(operationResponseSchema),
  })
  .merge(transactionCreateSchema.omit({ operations: true }));
