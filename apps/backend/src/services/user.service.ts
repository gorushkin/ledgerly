import { UsersCreateDTO } from '@ledgerly/shared/types';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

export class UserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordManager: PasswordManager,
  ) {}

  getById(id: string) {
    return this.usersRepository.getUserById(id);
  }

  async update(id: string, userData: UsersCreateDTO) {
    const hashedPassword = await this.passwordManager.hash(userData.password);
    return this.usersRepository.updateUser(id, {
      ...userData,
      password: hashedPassword,
    });
  }

  delete(id: string) {
    return this.usersRepository.deleteUser(id);
  }
}
