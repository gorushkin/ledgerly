import { Account, AccountType, Commodity } from 'src/domain';
import {
  Name,
  Email,
  Password,
  Amount,
  CommodityCode,
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

export const createCommodity = (
  user: User,
  params: {
    name?: string;
    code?: string;
    precision?: number;
    symbol?: string | null;
  } = {},
): Commodity => {
  const {
    code = 'TEST',
    name = 'Test Commodity',
    precision = 2,
    symbol = null,
  } = params;

  return Commodity.create(
    user,
    Name.create(name),
    CommodityCode.create(code),
    precision,
    symbol,
  );
};

export const createAccount = (
  user: User,

  params: {
    description?: string;
    name?: string;
    commodity?: Commodity;
  } = {},
) => {
  const commodity = params.commodity ?? createCommodity(user);

  return Account.create(user, {
    commodityId: commodity.getId(),
    description: params.description ?? 'Account for testing',
    initialBalance: Amount.create('0'),
    name: Name.create(params.name ?? 'Test Account'),
    type: AccountType.create('asset'),
  });
};
