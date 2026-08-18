import { UserResponseDTO } from '@ledgerly/shared/types';
import { User } from 'src/domain';
import { UserSnapshot } from 'src/domain/users';

export class UserMapper {
  static toResponseDTO(user: User): UserResponseDTO {
    const snapshot = user.toSnapshot();

    return {
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    };
  }

  static toResponseDTOFromSnapshot(snapshot: UserSnapshot): UserResponseDTO {
    return {
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    };
  }
}
