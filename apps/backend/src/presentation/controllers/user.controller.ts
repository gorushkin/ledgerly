import { UUID } from '@ledgerly/shared/types';
import {
  passwordChangeSchema,
  usersUpdateSchema,
} from '@ledgerly/shared/validation';
import { UserService } from 'src/services/user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getById(id: UUID) {
    return this.userService.getById(id);
  }

  async update(id: UUID, requestBody: unknown) {
    const updatedProfileDTO = usersUpdateSchema.parse(requestBody);

    return this.userService.update(id, updatedProfileDTO);
  }

  async changePassword(id: UUID, requestBody: unknown) {
    const passwordChangeDTO = passwordChangeSchema.parse(requestBody);

    await this.userService.changePassword(id, passwordChangeDTO);
  }

  async delete(id: UUID) {
    return this.userService.delete(id);
  }
}
