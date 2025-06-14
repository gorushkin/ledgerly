import { describe, beforeEach, it, expect, beforeAll } from 'vitest';

import { createTestDb } from '../../db/test-db';
import { UsersRepository } from '../../infrastructure/db/UsersRepository';

describe('UsersRepository', () => {
  const { cleanupTestDb, db, setupTestDb } = createTestDb();
  const repository = new UsersRepository(db);

  const email = 'test@example.com';
  const password = 'password123';
  const name = 'Test User';

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await cleanupTestDb();
    await setupTestDb();
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const user = await repository.create({ email, name, password });

      const foundUser = await repository.getUserById(user.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.name).toBe(name);
      expect(foundUser).not.toHaveProperty('password'); // Проверяем, что пароль не возвращается
    });

    it('should return undefined for non-existent user', async () => {
      const foundUser = await repository.getUserById('non-existent-id');

      expect(foundUser).toBeUndefined();
    });
  });

  describe('getUserByIdWithPassword', () => {
    it('should get user with password by id', async () => {
      const user = await repository.create({ email, name, password });

      const foundUser = await repository.getUserByIdWithPassword(user.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.name).toBe(name);
      expect(foundUser?.password).toBe(password); // Проверяем, что пароль возвращается
    });

    it('should return undefined for non-existent user', async () => {
      const foundUser =
        await repository.getUserByIdWithPassword('non-existent-id');

      expect(foundUser).toBeUndefined();
    });
  });

  describe('getUserByEmailWithPassword', () => {
    it('should get user with password by email', async () => {
      await repository.create({ email, name, password });

      const foundUser = await repository.getUserByEmailWithPassword(email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.name).toBe(name);
      expect(foundUser?.password).toBe(password);
    });

    it('should return undefined for non-existent email', async () => {
      const foundUser = await repository.getUserByEmailWithPassword(
        'non-existent@email.com',
      );

      expect(foundUser).toBeUndefined();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const user = await repository.create({ email, name, password });
      const updateData = { email: 'updated@email.com', name: 'Updated Name' };

      const updatedUser = await repository.updateUserProfile(
        user.id,
        updateData,
      );

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email);
      expect(updatedUser.id).toBe(user.id);
    });

    it('should update only provided fields', async () => {
      const user = await repository.create({ email, name, password });
      const updateData = { name: 'Only Name Updated' };

      const updatedUser = await repository.updateUserProfile(
        user.id,
        updateData,
      );

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(email); // Оригинальный email должен остаться
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const user = await repository.create({ email, name, password });

      const deletedUser = await repository.deleteUser(user.id);

      expect(deletedUser).toBeDefined();
      expect(deletedUser?.id).toBe(user.id);

      const foundUser = await repository.getUserById(user.id);
      expect(foundUser).toBeUndefined();
    });

    it('should return undefined when trying to delete non-existent user', async () => {
      const result = await repository.deleteUser('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const user = await repository.create({ email, name, password });

      expect(user.email).toBe(email);
      expect(user.name).toBe(name);

      expect(1).toBe(1); // Placeholder for actual test logic
    });

    it('should not return password in create response', async () => {
      const user = await repository.create({ email, name, password });

      expect(user).not.toHaveProperty('password');
    });

    it('should generate unique IDs for different users', async () => {
      const user1 = await repository.create({
        email: 'user1@test.com',
        name: 'User 1',
        password,
      });
      const user2 = await repository.create({
        email: 'user2@test.com',
        name: 'User 2',
        password,
      });

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      await repository.create({ email, name, password });

      const user = await repository.findByEmail(email);

      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.name).toBe(name);
    });

    it('should return undefined for non-existent email', async () => {
      const user = await repository.findByEmail('non-existent@email.com');

      expect(user).toBeUndefined();
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const user = await repository.create({ email, name, password });

      const newHashedPassword = 'newpassword123';

      await repository.updateUserPassword(user.id, newHashedPassword);

      const updatedUser = await repository.getUserByIdWithPassword(user.id);

      expect(updatedUser?.password).toBe(newHashedPassword);
    });
  });
});
