import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';

import { db } from '../index';
import { transactionsTable } from '../schemas';
import { accountsTable } from '../schemas/accounts';
import { usersTable } from '../schemas/users';

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

const seedUser = async () => {
  try {
    const passwordManager = new PasswordManager();
    const hashedPassword = await passwordManager.hash(USER_PASSWORD);
    const insertedUser = await db
      .insert(usersTable)
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

const deleteData = async () => {
  try {
    await db.delete(transactionsTable);
    await db.delete(accountsTable);
    await db.delete(usersTable);

    console.info('Data deleted successfully');
  } catch (error) {
    console.error('Ошибка при удалении данных:', error);
    throw new Error('Ошибка при удалении данных');
  }
};
export const addData = async () => {
  try {
    console.info('Starting seeding...');

    await seedUser();
    console.info('User seeded');

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
