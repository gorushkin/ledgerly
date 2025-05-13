import { db } from '../index';
import { accounts } from '../schemas/accounts';
import { categories } from '../schemas/categories';
import { entries } from '../schemas/entries';
import { transactions } from '../schemas/transactions';

const seedCategories = async () => {
  const insertedCategories = await db
    .insert(categories)
    .values([
      { name: 'Продукты' },
      { name: 'Транспорт' },
      { name: 'Жильё' },
      { name: 'Развлечения' },
      { name: 'Здоровье' },
      { name: 'Одежда' },
      { name: 'Доход' },
    ])
    .returning();

  return insertedCategories;
};

const seedWallets = async () => {
  const insertedWallets = await db
    .insert(accounts)
    .values([
      { currency_code: 'RUB', name: 'Tinkoff RUB' },
      { currency_code: 'USD', name: 'Cash USD' },
    ])
    .returning();

  return insertedWallets;
};

const seedTransactions = async () => {
  const insertedTransactions = await db
    .insert(transactions)
    .values([
      {
        comment: 'Еда и хозтовары',
        created_at: '2025-05-01',
        name: 'Покупка в магазине',
        posted_at: '2025-05-01',
      },
    ])
    .returning();

  return insertedTransactions;
};

const seedEntries = async (params: {
  categoryId: number;
  transactionId: number;
  accountId: string;
  catHousehold: number;
}) => {
  const { accountId, categoryId, catHousehold, transactionId } = params;

  await db.insert(entries).values([
    {
      accountId,
      amount: -1000,
      categoryId,
      date: '2025-05-01',
      description: 'Продукты',
      transactionId,
    },
    {
      accountId,
      amount: -500,
      categoryId: catHousehold,
      date: '2025-05-01',
      description: 'Хозтовары',
      transactionId,
    },
  ]);
};

const seedIncome = async (params: {
  categoryId: number;
  accountId: string;
}) => {
  const { accountId, categoryId: categoryId } = params;

  const incomeTx = await db
    .insert(transactions)
    .values([
      {
        comment: 'Май 2025',
        created_at: '2025-05-05',
        name: 'Зарплата',
        posted_at: '2025-05-05',
      },
    ])
    .returning();

  await db.insert(entries).values([
    {
      accountId,
      amount: 100000,
      categoryId,
      date: '2025-05-05',
      description: 'Зарплата',
      transactionId: incomeTx[0].id,
    },
  ]);
};

const seedCurrencyExchange = async (params: { accountId: string }) => {
  const { accountId } = params;

  const exchangeTx = await db
    .insert(transactions)
    .values([
      {
        comment: 'Обмен $100 на рубли',
        created_at: '2025-05-10',
        name: 'Обмен валюты',
        posted_at: '2025-05-10',
      },
    ])
    .returning();

  await db.insert(entries).values([
    {
      accountId: accountId, // USD
      amount: -100,
      date: '2025-05-10',
      description: 'USD ->',
      transactionId: exchangeTx[0].id,
    },
    {
      accountId: accountId, // RUB
      amount: 9300,
      date: '2025-05-10',
      description: '-> RUB',
      transactionId: exchangeTx[0].id,
    },
  ]);
};

const seed = async () => {
  const insertedCategories = await seedCategories();
  const insertedWallets = await seedWallets();
  const insertedTransactions = await seedTransactions();

  if (
    insertedTransactions.length === 0 ||
    insertedWallets.length === 0 ||
    insertedCategories.length === 0
  ) {
    console.error('Не удалось сидировать: отсутствуют ключевые записи.');
    return;
  }

  const accountId = insertedWallets[0].id;
  const categoryId = insertedCategories.find((c) => c.name === 'Продукты')?.id;
  const catHousehold = insertedCategories.find((c) => c.name === 'Жильё')?.id;

  if (!categoryId || !catHousehold) {
    console.error('Не найдены категории Продукты или Жильё.');
    return;
  }

  // Insert entries (split the transaction)
  await seedEntries({
    accountId,
    categoryId,
    catHousehold,
    transactionId: insertedTransactions[0].id,
  });

  // Add income and exchange transactions
  const catIncome = insertedCategories.find((c) => c.name === 'Доход')?.id;

  if (!catIncome) {
    console.error("Категория 'Доход' не найдена.");
    return;
  }

  // Insert income transaction
  await seedIncome({ accountId: accountId, categoryId: catIncome });

  // Insert currency exchange transaction
  await seedCurrencyExchange({
    accountId: insertedWallets[0].id,
  });

  // eslint-disable-next-line no-console
  console.log('Сиды добавлены!');
};

void seed();
