import { UserResponseDTO } from 'src/application/dto';
import { User } from 'src/domain';

export class UserMapper {
  static toResponseDTO(user: User): UserResponseDTO {
    const snapshot = user.toSnapshot();

    return {
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    };
  }
}
