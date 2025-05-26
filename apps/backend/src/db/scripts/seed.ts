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
        id: crypto.randomUUID(),
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
  const insertedCurrencies = await seedCurrencies();
  console.info('insertedCurrencies: ', insertedCurrencies);
  const _insertedCategories = await seedCategories();
  const _insertedAccounts = await seedAccounts();

  console.info('Сиды добавлены!');
};

void seed();
