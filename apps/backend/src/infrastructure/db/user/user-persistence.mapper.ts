import { UserDbInsert, UserDbRow } from 'src/db/schemas';
import { User } from 'src/domain';
import { UserSnapshot, UserProfileSnapshot } from 'src/domain/users/';

export class UserPersistenceMapper {
  static toDomain(row: UserDbRow): User {
    return User.restore(UserPersistenceMapper.toSnapshot(row));
  }

  static toSnapshot(row: UserDbRow): UserSnapshot {
    return {
      createdAt: row.createdAt,
      email: row.email,
      id: row.id,
      name: row.name,
      password: row.password,
      updatedAt: row.updatedAt,
    };
  }

  static toProfileSnapshot(row: UserDbRow): UserProfileSnapshot {
    return {
      email: row.email,
      id: row.id,
      name: row.name,
    };
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
}
