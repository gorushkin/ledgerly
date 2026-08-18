import { UserResponseDTO } from '@ledgerly/shared/types';
import { EntityNotFoundError } from 'src/application/application.errors';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { UserMapper } from 'src/application/mappers';
import { User } from 'src/domain/users/';

export class GetCurrentUserUseCase {
  constructor(private readonly usersRepository: UserRepositoryInterface) {}
  async execute(user: User): Promise<UserResponseDTO> {
    const userId = user.getId().valueOf();

    const userSnapshot = await this.usersRepository.getById(userId);

    if (!userSnapshot) {
      throw new EntityNotFoundError({
        entityId: userId,
        entityType: User.entityType,
      });
    }

    return UserMapper.toResponseDTOFromProfileSnapshot(userSnapshot);
  }
}
