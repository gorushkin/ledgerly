import { User } from 'src/domain';
import { Email, Name, Password } from 'src/domain/domain-core';
export const createUser = async (name = 'Ivan', email = 'ivan@example.com') => {
  const userName = Name.create(name);
  const userEmail = Email.create(email);
  const userPassword = await Password.create('securepassword');
  const user = User.create(userName, userEmail, userPassword);
  return user;
};
