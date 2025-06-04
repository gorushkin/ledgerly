import { UsersCreateDTO } from '@ledgerly/shared/types';
import bcrypt from 'bcryptjs';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

export class UserService {
  constructor(private readonly usersRepository: UsersRepository) {}

  getById(id: string) {
    return this.usersRepository.getUserById(id);
  }

  async update(id: string, userData: UsersCreateDTO) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return this.usersRepository.updateUser(id, {
      ...userData,
      password: hashedPassword,
    });
  }

  delete(id: string) {
    return this.usersRepository.deleteUser(id);
  }
}
