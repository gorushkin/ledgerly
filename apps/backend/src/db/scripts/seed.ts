import {
  AccountResponseDTO,
  CategoryResponseDTO,
} from '@ledgerly/shared/types';

import { db } from '../index';
import { operations, transactions } from '../schemas';
import { accounts } from '../schemas/accounts';
import { categories } from '../schemas/categories';
import { users } from '../schemas/users';

const CATEGORY_ID1 = '3a04352a-68f2-4c96-9b0d-dc0df9957441'; // Example category ID
const CATEGORY_ID2 = '0022c3b2-24f5-483d-9c0b-fccc2b46972d'; // Example category ID

const ACCOUNT_ID1 = '3a3c164d-a33a-4d61-8dd9-626dbb7d6a5b';
const ACCOUNT_ID2 = '0055a5ca-faf1-46f2-afbe-6d36b1544b75'; // Example account ID

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

class SeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedError';
  }
}

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

const seedAccounts = async (userId: string) => {
  try {
    const insertedWallets = await db
      .insert(accounts)
      .values([
        {
          id: ACCOUNT_ID1,
          name: 'Tinkoff RUB',
          originalCurrency: 'RUB',
          type: 'cash',
          userId,
        },
        {
          id: ACCOUNT_ID2,
          name: 'Cash USD',
          originalCurrency: 'USD',
          type: 'cash',
          userId,
        },
      ])
      .returning();

    return insertedWallets;
  } catch {
    throw new SeedError('Ошибка при добавлении счетов:');
  }
};

const seedUsers = async () => {
  try {
    const [user] = await db
      .insert(users)
      .values({
        email: 'test@example.com',
        id: USER_ID,
        name: 'Test User',
      })
      .returning();

    return user;
  } catch (error) {
    console.error('Ошибка при добавлении пользователя:', error);
    throw new SeedError('Ошибка при добавлении пользователя:');
  }
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
  // await db.insert(operations).values([
  //   {
  //     accountId: rubAccount.id,
  //     baseCurrency: 'RUB',
  //     categoryId: productsCategory.id,
  //     description: 'Списание RUB',
  //     localAmount: -1000,
  //     originalAmount: -1000,
  //     originalCurrency: 'RUB',
  //     transactionId: transaction.id,
  //   },
  //   {
  //     accountId: usdAccount.id,
  //     baseCurrency: 'USD',
  //     categoryId: transportCategory.id,
  //     description: 'Получение USD',
  //     localAmount: 10,
  //     originalAmount: 10,
  //     originalCurrency: 'USD',
  //     transactionId: transaction.id,
  //   },
  // ]);

  await db.batch([
    db.insert(operations).values({
      accountId: rubAccount.id,
      categoryId: productsCategory.id,
      description: 'Списание RUB',
      localAmount: -1000,
      originalAmount: -1000,
      transactionId: transaction.id,
    }),
    db.insert(operations).values({
      accountId: usdAccount.id,
      categoryId: transportCategory.id,
      description: 'Получение USD',
      localAmount: 10,
      originalAmount: 10,
      transactionId: transaction.id,
    }),
  ]);

  return transaction;
};

const deleteData = async () => {
  try {
    await db.delete(transactions);
    await db.delete(accounts);
    await db.delete(categories);
    await db.delete(users);

    console.info('Data deleted successfully');
  } catch (error) {
    console.error('Ошибка при удалении данных:', error);
    throw new Error('Ошибка при удалении данных');
  }
};

const addData = async () => {
  try {
    const insertedCategories = await seedCategories();
    console.info('insertedCategories: ', insertedCategories);

    const insertedUsers = await seedUsers();
    console.info('insertedUsers: ', insertedUsers);

    const insertedAccounts = await seedAccounts(USER_ID);
    console.info('insertedAccounts: ', insertedAccounts);

    const insertedTransaction = await seedTransactionsAndOperations(
      insertedAccounts,
      insertedCategories,
    );

    console.info('insertedTransaction: ', insertedTransaction);

    console.info('Сиды успешно добавлены!');
  } catch (e) {
    if (e instanceof SeedError) {
      throw new SeedError('Ошибка при заполнении базы данных: ' + e.message);
    }
    throw e;
  }
};

const seed = async () => {
  try {
    console.info('Начало процесса сидирования...');

    await deleteData();

    await addData();

    console.info('Сиды успешно завершены!');
  } catch (error) {
    console.error('Ошибка при сидировании:');
    if (error instanceof SeedError) {
      console.error(error.message);
    }
  }
};

void seed();
