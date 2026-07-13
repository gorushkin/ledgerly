import { UserDbRow } from 'src/db/schema';
import { describe, expect, it } from 'vitest';

import { UserPersistenceMapper } from './user-persistence.mapper';

describe('UserPersistenceMapper', () => {
  const row: UserDbRow = {
    createdAt: '2026-06-24T10:00:00.000Z' as UserDbRow['createdAt'],
    email: 'user@example.com',
    id: '11111111-1111-4111-8111-111111111111' as UserDbRow['id'],
    name: 'Test User',
    password: 'hashed-password',
    updatedAt: '2026-06-25T10:00:00.000Z' as UserDbRow['updatedAt'],
  };

  it('maps a persistence row to a domain user snapshot explicitly', () => {
    const user = UserPersistenceMapper.toDomain(row);

    expect(user.toSnapshot()).toEqual({
      createdAt: row.createdAt,
      email: row.email,
      id: row.id,
      name: row.name,
      password: row.password,
      updatedAt: row.updatedAt,
    });
  });

  it('maps a domain user to a persistence row', () => {
    const user = UserPersistenceMapper.toDomain(row);

    expect(UserPersistenceMapper.toDBRow(user)).toEqual({
      createdAt: row.createdAt,
      email: row.email,
      id: row.id,
      name: row.name,
      password: row.password,
      updatedAt: row.updatedAt,
    });
  });
});
