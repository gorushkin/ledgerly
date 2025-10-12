import { beforeEach, describe, expect, it } from 'vitest';

import { Email, Name, Password } from '../domain-core';

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
