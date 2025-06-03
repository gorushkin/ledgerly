import { UsersCreateDTO } from '@ledgerly/shared/types';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

export class UserController {
  constructor(private readonly repo: UsersRepository) {}

  getAll() {
    return this.repo.getUsers();
  }

  getById(id: string) {
    return this.repo.getUserById(id);
  }

  create(userData: UsersCreateDTO) {
    return this.repo.createUser(userData);
  }

  update(id: string, userData: UsersCreateDTO) {
    return this.repo.updateUser(id, userData);
  }

  delete(id: string) {
    return this.repo.deleteUser(id);
  }
}
