import { User } from 'src/domain';
import { UserProfileSnapshot, UserSnapshot } from 'src/domain/users/types';
import { describe, expect, it } from 'vitest';

import { UserMapper } from './user.mapper';

describe('UserMapper', () => {
  const snapshot: UserSnapshot = {
    createdAt: '2026-06-24T10:00:00.000Z' as UserSnapshot['createdAt'],
    email: 'user@example.com',
    id: '11111111-1111-4111-8111-111111111111' as UserSnapshot['id'],
    name: 'Test User',
    password: 'hashed-password',
    updatedAt: '2026-06-25T10:00:00.000Z' as UserSnapshot['updatedAt'],
  };

  const user = User.restore(snapshot);
  const profileSnapshot: UserProfileSnapshot = {
    email: snapshot.email,
    id: snapshot.id,
    name: snapshot.name,
  };

  it('maps a domain user to a response DTO without password', () => {
    const dto = UserMapper.toResponseDTO(user);

    expect(dto).toEqual({
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    });

    expect(dto).not.toHaveProperty('password');
  });

  it('maps a user profile snapshot to a response DTO', () => {
    const dto = UserMapper.toResponseDTOFromProfileSnapshot(profileSnapshot);

    expect(dto).toEqual({
      email: snapshot.email,
      id: snapshot.id,
      name: snapshot.name,
    });

    expect(dto).not.toHaveProperty('password');
  });
});
