import { ACCOUNT_TYPES } from "../constants/accountTypes";
import { CURRENCIES } from "../constants/currencies";
import { z } from "zod";

export type Account = {
  id: string;
  name: string;
  currency_code: (typeof CURRENCIES)[number]["code"];
  type: (typeof ACCOUNT_TYPES)[number]["value"];
  description?: string;
};

export const accountSchema = z.object({
  name: z.string().min(1, "Название счета обязательно"),
  type: z.string().min(1, "Тип счета обязателен"),
  currency_code: z.string().min(1, "Валюта обязательна"),
  balance: z.number().nonnegative("Баланс не может быть отрицательным"),
  description: z.string().optional(),
});

export type AccountDTO = z.infer<typeof accountSchema>;
