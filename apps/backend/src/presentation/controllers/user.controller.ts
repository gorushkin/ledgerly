import { UUID } from '@ledgerly/shared/types';

export class UserController {
  getById(_id: UUID) {
    // return this.userService.getById(id);
    throw new Error('Not implemented yet');
  }

  update(_id: UUID, _requestBody: unknown) {
    // const updatedProfileDTO = usersUpdateSchema.parse(requestBody);

    // return this.userService.update(id, updatedProfileDTO);
    throw new Error('Not implemented yet');
  }

  changePassword(_id: UUID, _requestBody: unknown) {
    // const passwordChangeDTO = passwordChangeSchema.parse(requestBody);

    // await this.userService.changePassword(id, passwordChangeDTO);
    throw new Error('Not implemented yet');
  }

  delete(_id: UUID) {
    // return this.userService.delete(id);
    throw new Error('Not implemented yet');
  }
}
