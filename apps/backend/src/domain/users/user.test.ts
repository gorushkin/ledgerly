import { apiErrorCodes } from '@ledgerly/shared/types';
import { UserOwnershipError } from 'src/domain/domain.errors';
import { beforeEach, describe, expect, it } from 'vitest';

import { Email, Name, Password } from '../domain-core';

import { UserSnapshot } from './types';
import { User } from './user.entity';

describe('User Domain Entity', () => {
  const validName = Name.create('user-name');
  const validEmail = Email.create('user@example.com');
  let password: Password;

  let user: User;

  beforeEach(async () => {
    password = await Password.create('password123');

    user = User.create(validName, validEmail, password);
  });

  describe('create method', () => {
    it('should create a user successfully', () => {
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(validEmail);
      expect(user.name).toBe(validName);
      expect(user.getId()).toBeDefined();
      expect(typeof user.getId().valueOf()).toBe('string');
    });

    it('should create users with unique IDs', () => {
      const user2 = User.create(validName, validEmail, password);

      expect(user.getId()).not.toBe(user2.getId());
    });

    it('should allow controlled updates through domain methods', () => {
      const newEmail = Email.create('new@example.com');
      const newName = Name.create('new-name');

      user.changeEmail(newEmail);
      user.changeName(newName);

      expect(user.email).toBe(newEmail);
      expect(user.name).toBe(newName);
    });
  });

  describe('domain methods', () => {
    it('should return a domain snapshot', () => {
      const snapshot = user.toSnapshot();

      expect(snapshot.email).toBe(validEmail.valueOf());
      expect(snapshot.id).toBe(user.getId().valueOf());
      expect(snapshot.name).toBe(validName.valueOf());
      expect(snapshot.password).toBe(password.valueOf());
      expect(typeof snapshot.createdAt).toBe('string');
      expect(typeof snapshot.updatedAt).toBe('string');
    });

    it('should restore a user from a domain snapshot', async () => {
      const snapshot = {
        createdAt: '2026-06-24T10:00:00.000Z',
        email: validEmail.valueOf(),
        id: '11111111-1111-4111-8111-111111111111',
        name: validName.valueOf(),
        password: password.valueOf(),
        updatedAt: '2026-06-25T10:00:00.000Z',
      } as UserSnapshot;

      const restoredUser = User.restore(snapshot);

      expect(restoredUser.toSnapshot()).toEqual(snapshot);
      await expect(restoredUser.validatePassword('password123')).resolves.toBe(
        true,
      );
    });

    it('should preserve createdAt and updatedAt order when restored', () => {
      const snapshot = {
        createdAt: '2026-06-24T10:00:00.000Z',
        email: validEmail.valueOf(),
        id: '11111111-1111-4111-8111-111111111111',
        name: validName.valueOf(),
        password: password.valueOf(),
        updatedAt: '2026-06-25T10:00:00.000Z',
      } as UserSnapshot;

      const restoredSnapshot = User.restore(snapshot).toSnapshot();

      expect(restoredSnapshot.createdAt).toBe(snapshot.createdAt);
      expect(restoredSnapshot.updatedAt).toBe(snapshot.updatedAt);
    });

    it('returns UNAUTHORIZED_ACCESS for a different user ID', () => {
      const differentUserId = User.create(validName, validEmail, password)
        .getId()
        .valueOf();

      try {
        user.validateUserOwnership(differentUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(UserOwnershipError);
        expect(error).toMatchObject({
          code: apiErrorCodes.unauthorizedAccess,
          context: {
            entityId: user.getId().valueOf(),
            entityType: User.entityType,
          },
        });
        return;
      }

      throw new Error('Expected UserOwnershipError to be thrown');
    });

    it('should update email through changeEmail method', () => {
      const newEmail = Email.create('updated@example.com');

      user.changeEmail(newEmail);

      expect(user.email).toBe(newEmail);
    });

    it('should update name through changeName method', () => {
      const newName = Name.create('updated-name');

      user.changeName(newName);

      expect(user.name).toBe(newName);
    });
  });

  describe('getter methods', () => {
    it('should return correct email', () => {
      expect(user.email).toBe(validEmail);
    });

    it('should return correct name', () => {
      expect(user.name).toBe(validName);
    });

    it('should return consistent ID', () => {
      const id1 = user.getId();
      const id2 = user.getId();

      expect(id1).toBe(id2);
    });
  });
});
