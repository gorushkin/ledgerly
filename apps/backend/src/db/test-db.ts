import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schemas';

export const createTestDb = () => {
  const client = createClient({
    url: 'file::memory:',
  });

  const db = drizzle(client, { schema });

  const setupTestDb = async () => {
    // Включаем поддержку foreign keys
    await db.run(sql`PRAGMA foreign_keys = ON;`);

    // Создаем таблицы в правильном порядке (учитывая foreign key constraints)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS currencies (
        code text PRIMARY KEY NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id text PRIMARY KEY NOT NULL,
        currency_code text NOT NULL,
        name text NOT NULL,
        type text DEFAULT 'cash' NOT NULL,
        description text DEFAULT '' NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (currency_code) REFERENCES currencies(code)
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id text PRIMARY KEY NOT NULL,
        description text DEFAULT '' NOT NULL,
        posting_date text NOT NULL,
        transaction_date text NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS operations (
        id text PRIMARY KEY NOT NULL,
        transaction_id text NOT NULL,
        account_id text NOT NULL,
        category_id text NOT NULL,
        base_currency text NOT NULL,
        original_currency text NOT NULL,
        local_amount real NOT NULL,
        original_amount real NOT NULL,
        description text DEFAULT '' NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE cascade,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (base_currency) REFERENCES currencies(code),
        FOREIGN KEY (original_currency) REFERENCES currencies(code)
      );
    `);

    // Добавляем тестовые валюты
    await db.run(sql`
      INSERT INTO currencies (code) VALUES 
        ('USD'),
        ('EUR'),
        ('RUB'),
        ('GBP'),
        ('JPY'),
        ('CNY'),
        ('CHF'),
        ('CAD');
    `);
  };

  const cleanupTestDb = async () => {
    await db.run(sql`PRAGMA foreign_keys = OFF;`);

    // Удаляем таблицы в обратном порядке из-за foreign key constraints
    await db.run(sql`
      DROP TABLE IF EXISTS operations;
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS accounts;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS currencies;
    `);
  };

  return { cleanupTestDb, db, setupTestDb };
};
