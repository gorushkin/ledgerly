export interface Account {
  id: number;
  name: string;
  currency_code: string; // Пример: 'USD', 'RUB'
  type: "budget" | "non-budget"; // Тип аккаунта: в бюджете или нет
}
