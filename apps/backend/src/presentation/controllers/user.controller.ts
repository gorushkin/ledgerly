import { PasswordChange, UsersUpdate } from '@ledgerly/shared/types';
import {
  passwordChangeSchema,
  usersUpdateSchema,
} from '@ledgerly/shared/validation';
import { UserService } from 'src/services/user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getById(id: string) {
    return this.userService.getById(id);
  }

  async update(id: string, requestBody: UsersUpdate) {
    const updatedProfileDTO = usersUpdateSchema.parse(requestBody);

    return this.userService.update(id, updatedProfileDTO);
  }

  async changePassword(id: string, requestBody: PasswordChange) {
    const passwordChangeDTO = passwordChangeSchema.parse(requestBody);

    await this.userService.changePassword(id, passwordChangeDTO);
  }

  async delete(id: string) {
    return this.userService.delete(id);
  }
}
