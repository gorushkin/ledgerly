import { User } from 'src/domain/users/user.entity';

const notImplemented = () => Promise.reject(new Error('Not implemented yet'));

export class UserController {
  getById(_user: User): Promise<never> {
    // return this.getUserProfileUseCase.execute(user);
    return notImplemented();
  }

  update(_user: User, _requestBody: unknown): Promise<never> {
    // const updatedProfileDTO = usersUpdateSchema.parse(requestBody);
    // return this.updateUserProfileUseCase.execute(user, updatedProfileDTO);
    return notImplemented();
  }

  changePassword(_user: User, _requestBody: unknown): Promise<never> {
    // const passwordChangeDTO = passwordChangeSchema.parse(requestBody);
    // return this.changeUserPasswordUseCase.execute(user, passwordChangeDTO);
    return notImplemented();
  }

  delete(_user: User): Promise<never> {
    // return this.deleteUserProfileUseCase.execute(user);
    return notImplemented();
  }
}
