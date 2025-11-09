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

  await testDB.createAccount(user.id, {
    name: 'Savings Account',
  });
  await testDB.createAccount(user.id, {
    name: 'Checking Account',
  });
};

void runSeeder();
