import { db } from '../index';
import { transactionsTable } from '../schemas';
import { accountsTable } from '../schemas/accounts';
import { usersTable } from '../schemas/users';

class SeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedError';
  }
}

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
export const addData = () => {
  try {
    console.info('Starting seeding...');

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
