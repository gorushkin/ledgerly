import { DataBase } from 'src/types';

import { db } from '../index';
import { currenciesTable } from '../schemas';

type Currency = {
  code: string;
  name: string;
  symbol: string;
};

const defaultCurrencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
];

// TODO: fix dataBase: DataBase = db as unknown as DataBase
export const seedCurrencies = async (
  dataBase: DataBase = db as unknown as DataBase,
) => {
  // console.info('🌱 Starting currency seeding...');

  try {
    // ✅ Используем Drizzle ORM с ON CONFLICT
    for (const currency of defaultCurrencies) {
      await dataBase.insert(currenciesTable).values(currency);

      // console.info(`✅ Currency ${currency.code} (${currency.name}) seeded`);
    }

    // console.info('🎉 Currency seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    throw error;
  }
};

// ✅ Для прямого запуска скрипта
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

//   seedCurrencies(databaseUrl)
//     .then(() => {
//       console.info('🏁 Script completed');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('💥 Script failed:', error);
//       process.exit(1);
//     });
// }
