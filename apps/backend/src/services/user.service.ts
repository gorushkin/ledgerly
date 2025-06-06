import { UsersCreateDTO } from '@ledgerly/shared/types';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

import { hashPassword } from '../utils/password.utils';

export class UserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getById(id: string) {
    return this.usersRepository.getUserById(id);
  }

  async update(id: string, userData: UsersCreateDTO) {
    const hashedPassword = await hashPassword(userData.password);
    return this.usersRepository.updateUser(id, {
      ...userData,
      password: hashedPassword,
    });
  }

  delete(id: string) {
    return this.usersRepository.deleteUser(id);
  }
}
