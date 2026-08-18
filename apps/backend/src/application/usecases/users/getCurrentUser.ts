import { UserResponseDTO } from '@ledgerly/shared/types';
import { UserMapper } from 'src/application/mappers';
import { User } from 'src/domain/';

export class GetCurrentUserUseCase {
  execute(user: User): UserResponseDTO {
    return UserMapper.toResponseDTOFromSnapshot(user.toSnapshot());
  }
}
