import { UserResponseDTO } from '@ledgerly/shared/types';
import { User } from 'src/domain';
import { UserProfileSnapshot } from 'src/domain/users';

export class UserMapper {
  static toResponseDTO(user: User): UserResponseDTO {
    const snapshot = user.toSnapshot();

    return {
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    };
  }

  static toResponseDTOFromProfileSnapshot(
    snapshot: UserProfileSnapshot,
  ): UserResponseDTO {
    return {
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    };
  }
}
