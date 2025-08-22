import {
  AccountResponseDTO,
  OperationCreateDTO,
  UsersResponseDTO,
  UUID,
} from '@ledgerly/shared/types';
import { TestDB } from 'src/db/test-db';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { beforeEach, describe } from 'vitest';
type TestDBTransactionParams = {
  userId: UUID;
  data?: {
    description?: string;
    postingDate: string;
    transactionDate: string;
    userId: UUID;
    operations?: OperationCreateDTO[];
  };
};

const getUserTransactionDTO = (params: {
  testAccount1: AccountResponseDTO;
  testAccount2: AccountResponseDTO;
  userId: UUID;
  description?: string;
}): TestDBTransactionParams => {
  const { description, userId } = params;

  return {
    data: {
      description: description,
      operations: [],
      postingDate: new Date().toString(),
      transactionDate: new Date().toString(),
      userId: userId,
    },
    userId: userId,
  };
};

describe('TransactionRepository', () => {
  let transactionRepository: TransactionRepository;
  let user: UsersResponseDTO;
  let testAccount1: AccountResponseDTO;
  let testAccount2: AccountResponseDTO;
  let testDB: TestDB;

  let firstUserTransactionData: TestDBTransactionParams[];
  let secondUserTransactionData: TestDBTransactionParams[];
  let transactionsToAdd: TestDBTransactionParams[];

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    transactionRepository = new TransactionRepository(testDB.db);

    user = await testDB.createUser();

    testAccount1 = await testDB.createAccount(user.id, {
      name: 'Test Account 1',
    });

    testAccount2 = await testDB.createAccount(user.id, {
      name: 'Test Account 2',
    });

    const secondUser = await testDB.createUser({});

    const firstUserTransactionDTO_1 = getUserTransactionDTO({
      description: 'User 1 Transaction 1',
      testAccount1,
      testAccount2,
      userId: user.id,
    });

    const firstUserTransactionDTO_2 = getUserTransactionDTO({
      description: 'User 1 Transaction 2',
      testAccount1,
      testAccount2,
      userId: user.id,
    });

    firstUserTransactionData = [
      firstUserTransactionDTO_1,
      firstUserTransactionDTO_2,
    ];

    const secondUserTransactionDTO = getUserTransactionDTO({
      description: 'User 2 Transaction 1',
      testAccount1,
      testAccount2,
      userId: secondUser.id,
    });

    secondUserTransactionData = [secondUserTransactionDTO];

    transactionsToAdd = [
      ...firstUserTransactionData,
      ...secondUserTransactionData,
    ];
  });

  describe('create', () => {});

  describe('delete', () => {});

  describe('getAllByUserId', () => {});

  describe('getAll', () => {});

  describe('getTransactionById', () => {});

  describe('update', () => {});
});
