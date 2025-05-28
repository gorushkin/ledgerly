import { CURRENCY_TYPES } from '@ledgerly/shared/constants';

import { db } from '../index';
import { accounts } from '../schemas/accounts';
import { categories } from '../schemas/categories';
import { currencies } from '../schemas/currencies';

const seedCurrencies = async () => {
  const insertedCurrencies = await db
    .insert(currencies)
    .values(
      CURRENCY_TYPES.map((code) => ({
        code,
      })),
    )
    .returning();

  return insertedCurrencies;
};

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

const seedAccounts = async () => {
  const insertedWallets = await db
    .insert(accounts)
    .values([
      { currency_code: 'RUB', name: 'Tinkoff RUB' },
      { currency_code: 'USD', name: 'Cash USD' },
    ])
    .returning();

  return insertedWallets;
};

const seed = async () => {
  try {
    // Очищаем таблицы в правильном порядке из-за внешних ключей
    await db.delete(accounts);
    await db.delete(categories);
    await db.delete(currencies);

    const insertedCurrencies = await seedCurrencies();
    console.info('insertedCurrencies: ', insertedCurrencies);

    const insertedCategories = await seedCategories();
    console.info('insertedCategories: ', insertedCategories);

    const insertedAccounts = await seedAccounts();
    console.info('insertedAccounts: ', insertedAccounts);

    console.info('Сиды успешно добавлены!');
  } catch (error) {
    console.error('Ошибка при заполнении базы данных:', error);
    throw error;
  }
};

void seed();
