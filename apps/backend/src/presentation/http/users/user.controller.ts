import { UserResponseDTO } from '@ledgerly/shared/types';
import {
  passwordChangeSchema,
  usersUpdateSchema,
} from '@ledgerly/shared/validation';
import {
  ChangeUserPasswordUseCase,
  GetCurrentUserUseCase,
  UpdateCurrentUserUseCase,
} from 'src/application/';
import { User } from 'src/domain/users/';

const notImplemented = () => Promise.reject(new Error('Not implemented yet'));

export class UserController {
  constructor(
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly updateCurrentUserUseCase: UpdateCurrentUserUseCase,
    private readonly changeUserPasswordUseCase: ChangeUserPasswordUseCase,
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

  async changePassword(
    user: User,
    requestBody: unknown,
  ): Promise<UserResponseDTO> {
    const passwordChangeDTO = passwordChangeSchema.parse(requestBody);

    return this.changeUserPasswordUseCase.execute(user, passwordChangeDTO);
  }

  delete(_user: User): Promise<never> {
    // return this.deleteUserProfileUseCase.execute(user);
    return notImplemented();
  }
}
