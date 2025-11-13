import { Amount } from 'src/domain/domain-core';

import { db } from '../index';
import { TestDB } from '../test-db';

const runSeeder = async () => {
  const testDB = new TestDB(db);
  await testDB.cleanupTestDb();
  await testDB.setupTestDb();

  const user = await testDB.createUser({
    email: 'test@example4.com',
    name: 'Ivan',
    password: 'hashed_password',
  });

  const account1 = await testDB.createAccount(user.id, {
    name: 'Savings Account',
  });
  const account2 = await testDB.createAccount(user.id, {
    name: 'Checking Account',
  });

  const account3 = await testDB.createAccount(user.id, {
    name: 'Credit Card',
  });

  const transaction1 = await testDB.createTransaction(user.id);
  const transaction2 = await testDB.createTransaction(user.id);

  const entry1Transaction1 = await testDB.createEntry(user.id, {
    transactionId: transaction1.id,
  });

  const entry2Transaction1 = await testDB.createEntry(user.id, {
    transactionId: transaction1.id,
  });

  const entry1Transaction2 = await testDB.createEntry(user.id, {
    transactionId: transaction2.id,
  });

  await testDB.createOperation(user.id, {
    accountId: account1.id,
    amount: Amount.create('10000').valueOf(),
    description: 'Initial Deposit',
    entryId: entry1Transaction1.id,
  });

  await testDB.createOperation(user.id, {
    accountId: account2.id,
    amount: Amount.create('-5000').valueOf(),
    description: 'Grocery Shopping',
    entryId: entry1Transaction1.id,
  });

  await testDB.createOperation(user.id, {
    accountId: account3.id,
    amount: Amount.create('2000').valueOf(),
    description: 'Credit Card Payment',
    entryId: entry2Transaction1.id,
  });

  await testDB.createOperation(user.id, {
    accountId: account1.id,
    amount: Amount.create('-2000').valueOf(),
    description: 'Utility Bill',
    entryId: entry2Transaction1.id,
  });

  await testDB.createOperation(user.id, {
    accountId: account1.id,
    amount: Amount.create('15000').valueOf(),
    description: 'Salary',
    entryId: entry1Transaction2.id,
  });

  await testDB.createOperation(user.id, {
    accountId: account2.id,
    amount: Amount.create('-15000').valueOf(),
    description: 'Rent Payment',
    entryId: entry1Transaction2.id,
  });

  console.info('Database seeding completed.');
};

void runSeeder();
