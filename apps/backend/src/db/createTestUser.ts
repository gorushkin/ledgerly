import { Account, AccountType } from 'src/domain';
import {
  Name,
  Email,
  Password,
  Amount,
  Currency,
} from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

// TODO: move to the test builder
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

export const createAccount = (
  user: User,
  params: { currency?: Currency; description?: string; name?: string } = {},
) => {
  return Account.create(
    user,
    Name.create(params.name ?? 'Test Account'),
    params.description ?? 'Account for testing',
    Amount.create('0'),
    params.currency ?? Currency.create('USD'),
    AccountType.create('asset'),
  );
};

// export const createTransaction = (
//   user: User,
//   params: {
//     description?: string;
//     postingDate?: IsoDateString;
//     transactionDate?: IsoDateString;
//   } = {},
// ) => {
//   const {
//     description = 'Test Transaction',
//     postingDate = '2023-01-01' as IsoDateString,
//     transactionDate = '2023-01-01' as IsoDateString,
//   } = params;

//   // const postingDate = DateValue.restore(postingDate)

//   return Transaction.create(
//     user,
//     {
//       description,
//       entries: [],
//       postingDate,
//       transactionDate,
//     },
//     {}, // EntryContext placeholder
//     // DateValue.restore(transactionDate),
//   );
// };

// export const createEntry = (
//   user: User,
//   transaction: Transaction,
//   operations: Operation[],
// ) => {
//   return Entry.create(user, transaction, 'Test entry', operations);
// };

// export const createOperation = (
//   user: User,
//   account: Account,
//   entry: Entry,
//   amount: Amount,
//   description: string,
// ) => {
//   return Operation.create(user, account, entry, amount, description);
// };
