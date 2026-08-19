import { UserResponseDTO } from '@ledgerly/shared/types';
import { UserSnapshot } from 'src/domain/users';

export class UserMapper {
  static toResponseDTOFromSnapshot(snapshot: UserSnapshot): UserResponseDTO {
    return {
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    };
  }
}
