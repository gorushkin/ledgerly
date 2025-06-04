import { UsersCreateDTO } from '@ledgerly/shared/types';
import bcrypt from 'bcryptjs';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

export class UserController {
  constructor(private readonly repo: UsersRepository) {}

  getAll() {
    return this.repo.getUsers();
  }

  getById(id: string) {
    return this.repo.getUserById(id);
  }

  // async create(userData: UsersCreateDTO) {
  //   const hashedPassword = await bcrypt.hash(userData.password, 10);
  //   return this.repo.create({
  //     ...userData,
  //     password: hashedPassword,
  //   });
  // }

  async update(id: string, userData: UsersCreateDTO) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return this.repo.updateUser(id, {
      ...userData,
      password: hashedPassword,
    });
  }

  delete(id: string) {
    return this.repo.deleteUser(id);
  }
}
