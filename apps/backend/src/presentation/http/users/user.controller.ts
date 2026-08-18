import { UserResponseDTO } from '@ledgerly/shared/types';
import { usersUpdateSchema } from '@ledgerly/shared/validation';
import {
  GetCurrentUserUseCase,
  UpdateCurrentUserUseCase,
} from 'src/application/usecases/users';
import { User } from 'src/domain/users/user.entity';

const notImplemented = () => Promise.reject(new Error('Not implemented yet'));

export class UserController {
  constructor(
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly updateCurrentUserUseCase: UpdateCurrentUserUseCase,
  ) {}
  getCurrentUser(user: User): UserResponseDTO {
    return this.getCurrentUserUseCase.execute(user);
  }

  async updateCurrentUser(
    user: User,
    requestBody: unknown,
  ): Promise<UserResponseDTO> {
    const updatedProfileDTO = usersUpdateSchema.parse(requestBody);
    return this.updateCurrentUserUseCase.execute(user, updatedProfileDTO);
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
