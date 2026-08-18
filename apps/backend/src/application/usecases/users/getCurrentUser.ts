import { UserResponseDTO } from '@ledgerly/shared/types';
import { UserMapper } from 'src/application/mappers';
import { User } from 'src/domain/users/';

export class GetCurrentUserUseCase {
  execute(user: User): UserResponseDTO {
    return UserMapper.toResponseDTO(user);
  }
}
