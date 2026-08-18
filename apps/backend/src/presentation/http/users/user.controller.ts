import { UserResponseDTO } from '@ledgerly/shared/types';
import { GetCurrentUserUseCase } from 'src/application/usecases/users';
import { User } from 'src/domain/users/user.entity';

const notImplemented = () => Promise.reject(new Error('Not implemented yet'));

export class UserController {
  constructor(private readonly getCurrentUserUseCase: GetCurrentUserUseCase) {}
  getCurrentUser(user: User): Promise<UserResponseDTO> {
    return this.getCurrentUserUseCase.execute(user);
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
