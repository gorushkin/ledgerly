import { Account, Entry, Operation, Transaction } from 'src/domain';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import {
  Name,
  Email,
  Password,
  Amount,
  Currency,
  DateValue,
} from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

export const createUser = async (
  params: {
    name?: string;
    email?: string;
    password?: string;
  } = {},
) => {
  const {
    email = `testuser+${crypto.randomUUID()}@example.com`,
    name = 'Test User',
    password = 'SecurePassword123',
  } = params;
  const userName = Name.create(name);
  const userEmail = Email.create(email);
  const userPassword = await Password.create(password);

  return User.create(userName, userEmail, userPassword);
};

export const createAccount = (user: User) => {
  return Account.create(
    user,
    Name.create('Test Account'),
    'Account for testing',
    Amount.create('0'),
    Currency.create('USD'),
    AccountType.create('asset'),
    false,
  );
};

export const createTransaction = (
  user: User,
  params: {
    description?: string;
    postingDate?: string;
    transactionDate?: string;
  } = {},
) => {
  const {
    description = 'Test Transaction',
    postingDate = '2023-01-01',
    transactionDate = '2023-01-01',
  } = params;

  return Transaction.create(
    user.getId(),
    description,
    DateValue.restore(postingDate),
    DateValue.restore(transactionDate),
  );
};

export const createEntry = (
  user: User,
  transaction: Transaction,
  operations: Operation[],
) => {
  return Entry.create(user, transaction, operations);
};
