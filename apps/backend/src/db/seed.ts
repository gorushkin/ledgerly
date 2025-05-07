import { db } from "./index";
import { categories } from "./categories";
import { accounts } from "./accounts";
import { transactions } from "./transactions";
import { entries } from "./entries";

async function seed() {
  // Insert categories
  const insertedCategories = await db
    .insert(categories)
    .values([
      { name: "Продукты" },
      { name: "Транспорт" },
      { name: "Жильё" },
      { name: "Развлечения" },
      { name: "Здоровье" },
      { name: "Одежда" },
      { name: "Доход" },
    ])
    .returning();

  // Insert wallets
  const insertedWallets = await db
    .insert(accounts)
    .values([
      { name: "Tinkoff RUB", currency_code: "RUB" },
      { name: "Cash USD", currency_code: "USD" },
    ])
    .returning();

  // Insert a transaction
  const insertedTransactions = await db
    .insert(transactions)
    .values([
      {
        name: "Покупка в магазине",
        comment: "Еда и хозтовары",
        created_at: "2025-05-01",
        posted_at: "2025-05-01",
      },
    ])
    .returning();

  if (
    insertedTransactions.length === 0 ||
    insertedWallets.length === 0 ||
    insertedCategories.length === 0
  ) {
    console.error("Не удалось сидировать: отсутствуют ключевые записи.");
    return;
  }

  const transactionId = insertedTransactions[0].id;
  const walletId = Number(insertedWallets[0].id);
  const catGrocery = insertedCategories.find((c) => c.name === "Продукты")?.id;
  const catHousehold = insertedCategories.find((c) => c.name === "Жильё")?.id;

  if (!catGrocery || !catHousehold) {
    console.error("Не найдены категории Продукты или Жильё.");
    return;
  }

  // Insert entries (split the transaction)
  await db.insert(entries).values([
    {
      description: "Продукты",
      amount: -1000,
      date: "2025-05-01",
      categoryId: catGrocery,
      transactionId,
      walletId,
    },
    {
      description: "Хозтовары",
      amount: -500,
      date: "2025-05-01",
      categoryId: catHousehold,
      transactionId,
      walletId,
    },
  ]);

  // Add income and exchange transactions
  const catIncome = insertedCategories.find((c) => c.name === "Доход")?.id;
  if (!catIncome) {
    console.error("Категория 'Доход' не найдена.");
    return;
  }

  // Insert income transaction
  const incomeTx = await db
    .insert(transactions)
    .values([
      {
        name: "Зарплата",
        comment: "Май 2025",
        created_at: "2025-05-05",
        posted_at: "2025-05-05",
      },
    ])
    .returning();

  await db.insert(entries).values([
    {
      description: "Зарплата",
      amount: 100000,
      date: "2025-05-05",
      categoryId: catIncome,
      transactionId: incomeTx[0].id,
      walletId,
    },
  ]);

  // Insert currency exchange transaction
  const exchangeTx = await db
    .insert(transactions)
    .values([
      {
        name: "Обмен валюты",
        comment: "Обмен $100 на рубли",
        created_at: "2025-05-10",
        posted_at: "2025-05-10",
      },
    ])
    .returning();

  await db.insert(entries).values([
    {
      description: "USD ->",
      amount: -100,
      date: "2025-05-10",
      transactionId: exchangeTx[0].id,
      walletId: Number(insertedWallets[1].id), // USD
    },
    {
      description: "-> RUB",
      amount: 9300,
      date: "2025-05-10",
      transactionId: exchangeTx[0].id,
      walletId: Number(insertedWallets[0].id), // RUB
    },
  ]);

  console.log("Сиды добавлены!");
}

seed();
