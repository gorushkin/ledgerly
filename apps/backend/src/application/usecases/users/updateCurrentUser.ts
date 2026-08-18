import { UserResponseDTO, UserUpdateDTO } from '@ledgerly/shared/types';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { UserMapper } from 'src/application/mappers';
import { mapRepositoryAlreadyExists } from 'src/application/shared/repositoryConflictMapper';
import { userRepositoryAlreadyExistsMappings } from 'src/application/shared/userRepositoryConflictMappings';
import { Email } from 'src/domain/domain-core/value-objects/Email';
import { Name } from 'src/domain/domain-core/value-objects/Name';
import { User } from 'src/domain/users/user.entity';

export class UpdateCurrentUserUseCase {
  constructor(private readonly usersRepository: UserRepositoryInterface) {}

  async execute(
    user: User,
    updatedProfileDTO: UserUpdateDTO,
  ): Promise<UserResponseDTO> {
    let isChanged = false;

    if (updatedProfileDTO.name) {
      user.changeName(Name.create(updatedProfileDTO.name));
      isChanged = true;
    }

    if (updatedProfileDTO.email) {
      user.changeEmail(Email.create(updatedProfileDTO.email));
      isChanged = true;
    }

    const snapshot = user.toSnapshot();

    if (isChanged) {
      await mapRepositoryAlreadyExists(
        () =>
          this.usersRepository.updateUserProfile(user.getId().valueOf(), {
            ...(updatedProfileDTO.email !== undefined && {
              email: snapshot.email,
            }),
            ...(updatedProfileDTO.name !== undefined && {
              name: snapshot.name,
            }),
            updatedAt: snapshot.updatedAt,
          }),
        userRepositoryAlreadyExistsMappings,
      );
    }

    return UserMapper.toResponseDTOFromProfileSnapshot(snapshot);
  }
}
