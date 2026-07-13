import { UserDbInsert, UserDbRow } from 'src/db/schema';
import { User } from 'src/domain';
import { UserSnapshot } from 'src/domain/users/types';

export class UserPersistenceMapper {
  static toDomain(row: UserDbRow): User {
    const snapshot: UserSnapshot = {
      createdAt: row.createdAt,
      email: row.email,
      id: row.id,
      name: row.name,
      password: row.password,
      updatedAt: row.updatedAt,
    };

    return User.restore(snapshot);
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
