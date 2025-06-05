import { UsersCreateDTO } from '@ledgerly/shared/types';
import { UserService } from 'src/services/user.service';

import { UserNotFoundError } from '../errors/auth.errors';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getById(id: string) {
    const user = await this.userService.getById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  async update(id: string, userData: UsersCreateDTO) {
    const user = await this.userService.getById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return this.userService.update(id, userData);
  }

  async delete(id: string) {
    const user = await this.userService.getById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    return this.userService.delete(id);
  }
}
