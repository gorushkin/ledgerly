import { UserResponseDTO } from 'src/application/dto';
import { UserDbInsert, UserDbRow } from 'src/db/schema';
import { User } from 'src/domain';

export class UserMapper {
  static toDomain(row: UserDbRow): User {
    return User.restore(row);
  }

  static toDBRow(user: User): UserDbInsert {
    const snapshot = user.toSnapshot();

    return {
      createdAt: snapshot.createdAt,
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
      password: snapshot.password,
      updatedAt: snapshot.updatedAt,
    };
  }

  static toResponseDTO(user: User): UserResponseDTO {
    const snapshot = user.toSnapshot();

    return {
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    };
  }
}
