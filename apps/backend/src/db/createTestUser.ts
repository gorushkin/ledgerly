import { Name, Email, Password } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

export const createUser = async (
  params: {
    name?: string;
    email?: string;
    password?: string;
  } = {},
) => {
  const {
    email = `testuser+${Date.now()}@example.com`,
    name = 'Test User',
    password = 'SecurePassword123',
  } = params;
  const userName = Name.create(name);
  const userEmail = Email.create(email);
  const userPassword = await Password.create(password);

  return User.create(userName, userEmail, userPassword);
};
