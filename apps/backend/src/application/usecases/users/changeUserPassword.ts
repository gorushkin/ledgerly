import { UserChangePasswordDTO, UserResponseDTO } from '@ledgerly/shared/types';
import type { UserRepositoryInterface } from 'src/application/interfaces';
import { UserMapper } from 'src/application/mappers';
import { User } from 'src/domain';
import { Password } from 'src/domain/domain-core/value-objects';

export class ChangeUserPasswordUseCase {
  constructor(private readonly usersRepository: UserRepositoryInterface) {}

  async execute(
    user: User,
    changeUserPasswordInput: UserChangePasswordDTO,
  ): Promise<UserResponseDTO> {
    const { currentPassword, newPassword } = changeUserPasswordInput;

    await user.validatePassword(currentPassword);

    const userPasswordVO = await Password.create(newPassword);

    user.changePassword(userPasswordVO);

    const snapshot = user.toSnapshot();

    await this.usersRepository.updateUserPassword(user.getId().valueOf(), {
      password: snapshot.password,
      updatedAt: snapshot.updatedAt,
    });

    return UserMapper.toResponseDTOFromSnapshot(snapshot);
  }
}
