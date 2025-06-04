import { UsersCreateDTO } from '@ledgerly/shared/types';
import { UserService } from 'src/services/user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  getById(id: string) {
    return this.userService.getById(id);
  }

  update(id: string, userData: UsersCreateDTO) {
    return this.userService.update(id, userData);
  }

  delete(id: string) {
    return this.userService.delete(id);
  }
}
