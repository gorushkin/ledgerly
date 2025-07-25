import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';

import { db } from '../index';
import { transactions } from '../schemas';
import { accounts } from '../schemas/accounts';
import { categories } from '../schemas/categories';
import { users } from '../schemas/users';

const CATEGORY_ID1 = '3a04352a-68f2-4c96-9b0d-dc0df9957441';
const CATEGORY_ID2 = '0022c3b2-24f5-483d-9c0b-fccc2b46972d';

const ACCOUNT_ID1 = '3a3c164d-a33a-4d61-8dd9-626dbb7d6a5b';
const ACCOUNT_ID2 = '0055a5ca-faf1-46f2-afbe-6d36b1544b75';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_EMAIL = 'test@example.com';
const USER_NAME = 'Test User';
const USER_PASSWORD = 'test_password';

class SeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedError';
  }
}

const seedCategories = async (userId: string) => {
  const insertedCategories = await db
    .insert(categories)
    .values([
      { id: CATEGORY_ID1, name: 'Продукты', userId },
      { id: CATEGORY_ID2, name: 'Транспорт', userId },
      { name: 'Жильё', userId },
      { name: 'Развлечения', userId },
      { name: 'Здоровье', userId },
      { name: 'Одежда', userId },
      { name: 'Доход', userId },
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
          name: 'Tinkoff USD',
          originalCurrency: 'USD',
          type: 'cash',
          userId,
        },
      ])
      .returning();

    return insertedWallets;
  } catch {
    throw new SeedError('Failed to seed accounts');
  }
};

const seedUser = async () => {
  try {
    const passwordManager = new PasswordManager();
    const hashedPassword = await passwordManager.hash(USER_PASSWORD);
    const insertedUser = await db
      .insert(users)
      .values({
        email: USER_EMAIL,
        id: USER_ID,
        name: USER_NAME,
        password: hashedPassword,
      })
      .returning();

    return insertedUser[0];
  } catch (error) {
    console.error('Error details:', error);
    throw new SeedError('Failed to seed user');
  }
};

// const seedTransaction = async (_accounts: AccountResponse[]) => {
//   try {
//     const insertedTransaction = await db
//       .insert(transactions)
//       .values({
//         description: 'Test transaction',
//         postingDate: new Date().toISOString(),
//         transactionDate: new Date().toISOString(),
//       })
//       .returning();

//     return insertedTransaction[0];
//   } catch {
//     throw new SeedError('Failed to seed transaction');
//   }
// };

// const seedOperations = async (
//   transaction: { id: string },
//   accounts: AccountResponse[],
//   categories: CategoryResponse[],
// ) => {
//   try {
//     const insertedOperations = await db
//       .insert(operations)
//       .values([
//         {
//           accountId: accounts[0].id,
//           categoryId: categories[0].id,
//           description: 'Test operation 1',
//           localAmount: 100,
//           originalAmount: 100,
//           transactionId: transaction.id,
//         },
//         {
//           accountId: accounts[1].id,
//           categoryId: categories[1].id,
//           description: 'Test operation 2',
//           localAmount: -100,
//           originalAmount: -1,
//           transactionId: transaction.id,
//         },
//       ])
//       .returning();

//     return insertedOperations;
//   } catch {
//     throw new SeedError('Failed to seed operations');
//   }
// };

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
export const addData = async () => {
  try {
    console.info('Starting seeding...');

    const user = await seedUser();
    console.info('User seeded');

    await seedCategories(user.id);
    console.info('Categories seeded');

    // const insertedAccounts = await seedAccounts(user.id);
    // console.info('Accounts seeded');

    // const transaction = await seedTransaction(insertedAccounts);
    // console.info('Transaction seeded');

    // await seedOperations(transaction, insertedAccounts, insertedCategories);
    // console.info('Operations seeded');

    console.info('Seeding completed successfully');
  } catch (error) {
    if (error instanceof SeedError) {
      console.error('Seeding failed:', error.message);
    } else {
      console.error('Unexpected error during seeding:', error);
    }
    process.exit(1);
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
