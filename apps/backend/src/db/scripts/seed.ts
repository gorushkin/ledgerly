import {
  AccountResponseDTO,
  CategoryResponseDTO,
} from '@ledgerly/shared/types';

import { db } from '../index';
import { operations, transactions } from '../schemas';
import { accounts } from '../schemas/accounts';
import { categories } from '../schemas/categories';

const CATEGORY_ID1 = '3a04352a-68f2-4c96-9b0d-dc0df9957441'; // Example category ID
const CATEGORY_ID2 = '0022c3b2-24f5-483d-9c0b-fccc2b46972d'; // Example category ID

const ACCOUNT_ID1 = '3a3c164d-a33a-4d61-8dd9-626dbb7d6a5b';
const ACCOUNT_ID2 = '0055a5ca-faf1-46f2-afbe-6d36b1544b75'; // Example account ID

const seedCategories = async () => {
  const insertedCategories = await db
    .insert(categories)
    .values([
      { id: CATEGORY_ID1, name: 'Продукты' },
      { id: CATEGORY_ID2, name: 'Транспорт' },
      { name: 'Жильё' },
      { name: 'Развлечения' },
      { name: 'Здоровье' },
      { name: 'Одежда' },
      { name: 'Доход' },
    ])
    .returning();

  return insertedCategories;
};

const seedAccounts = async () => {
  const insertedWallets = await db
    .insert(accounts)
    .values([
      { currencyCode: 'RUB', id: ACCOUNT_ID1, name: 'Tinkoff RUB' },
      { currencyCode: 'USD', id: ACCOUNT_ID2, name: 'Cash USD' },
    ])
    .returning();

  return insertedWallets;
};

const seedTransactionsAndOperations = async (
  insertedAccounts: AccountResponseDTO[],
  insertedCategories: CategoryResponseDTO[],
) => {
  const now = new Date().toISOString();
  const [rubAccount, usdAccount] = insertedAccounts;
  const [productsCategory, transportCategory] = insertedCategories;

  // Create a transfer transaction
  const [transaction] = await db
    .insert(transactions)
    .values({
      description: 'Перевод из RUB в USD',
      postingDate: now,
      transactionDate: now,
    })
    .returning();

  // Create operations for the transfer
  await db.insert(operations).values([
    {
      accountId: rubAccount.id,
      baseCurrency: 'RUB',
      categoryId: productsCategory.id,
      description: 'Списание RUB',
      localAmount: -1000,
      originalAmount: -1000,
      originalCurrency: 'RUB',
      transactionId: transaction.id,
    },
    {
      accountId: usdAccount.id,
      baseCurrency: 'USD',
      categoryId: transportCategory.id,
      description: 'Получение USD',
      localAmount: 10,
      originalAmount: 10,
      originalCurrency: 'USD',
      transactionId: transaction.id,
    },
  ]);

  return transaction;
};

const deleteData = async () => {
  try {
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(categories);

    console.info('Data deleted successfully');
  } catch (error) {
    console.error('Ошибка при удалении данных:', error);
    throw error;
  }
};

const addData = async () => {
  try {
    const insertedCategories = await seedCategories();
    console.info('insertedCategories: ', insertedCategories);

    const insertedAccounts = await seedAccounts();
    console.info('insertedAccounts: ', insertedAccounts);

    const insertedTransaction = await seedTransactionsAndOperations(
      insertedAccounts,
      insertedCategories,
    );
    console.info('insertedTransaction: ', insertedTransaction);

    console.info('Сиды успешно добавлены!');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    throw error;
  }
};

const seed = async () => {
  await deleteData();

  await addData();

  console.info('Seed completed successfully!');
};

void seed();
