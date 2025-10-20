import { Name, Email, Password } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';

export const createUser = async () => {
  const userName = Name.create('Ivan');
  const userEmail = Email.create('ivan@example.com');
  const userPassword = await Password.create('securepassword');

  return User.create(userName, userEmail, userPassword);
};
