import { describe, beforeEach, it, expect, beforeAll } from 'vitest';

import { createTestDb } from '../../db/test-db';
import { UsersRepository } from '../../infrastructure/db/UsersRepository';

describe('UsersRepository', () => {
  let testDbInstance: ReturnType<typeof createTestDb>;
  let userRepository: UsersRepository;

  const email = 'test@example.com';
  const password = 'password123';
  const name = 'Test User';

  beforeAll(async () => {
    testDbInstance = createTestDb();
    await testDbInstance.setupTestDb();
    userRepository = new UsersRepository(testDbInstance.db);
    testDbInstance = createTestDb();
    await testDbInstance.setupTestDb();
  });

  beforeEach(async () => {
    await testDbInstance.cleanupTestDb();
    testDbInstance = createTestDb();
    await testDbInstance.setupTestDb();
    userRepository = new UsersRepository(testDbInstance.db);
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      const user = await userRepository.create({ email, name, password });
      const foundUser = await userRepository.getUserById(user.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.name).toBe(name);
      expect(foundUser).not.toHaveProperty('password');
    });

    it('should return undefined for non-existent user', async () => {
      const foundUser = await userRepository.getUserById('non-existent-id');

      expect(foundUser).toBeUndefined();
    });
  });

  describe('getUserByIdWithPassword', () => {
    it('should get user with password by id', async () => {
      const user = await userRepository.create({ email, name, password });

      const foundUser = await userRepository.getUserByIdWithPassword(user.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.name).toBe(name);
      expect(foundUser?.password).toBe(password);
    });

    it('should return undefined for non-existent user', async () => {
      const foundUser =
        await userRepository.getUserByIdWithPassword('non-existent-id');

      expect(foundUser).toBeUndefined();
    });
  });

  describe('getUserByEmailWithPassword', () => {
    it('should get user with password by email', async () => {
      await userRepository.create({ email, name, password });

      const foundUser = await userRepository.getUserByEmailWithPassword(email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.name).toBe(name);
      expect(foundUser?.password).toBe(password);
    });

    it('should return undefined for non-existent email', async () => {
      const foundUser = await userRepository.getUserByEmailWithPassword(
        'non-existent@email.com',
      );

      expect(foundUser).toBeUndefined();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const user = await userRepository.create({ email, name, password });
      const updateData = { email: 'updated@email.com', name: 'Updated Name' };

      const updatedUser = await userRepository.updateUserProfile(
        user.id,
        updateData,
      );

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email);
      expect(updatedUser.id).toBe(user.id);
    });

    it('should update only provided fields', async () => {
      const user = await userRepository.create({ email, name, password });
      const updateData = { name: 'Only Name Updated' };

      const updatedUser = await userRepository.updateUserProfile(
        user.id,
        updateData,
      );

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(email); // Оригинальный email должен остаться
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const user = await userRepository.create({ email, name, password });

      const deletedUser = await userRepository.deleteUser(user.id);

      expect(deletedUser).toBeDefined();
      expect(deletedUser?.id).toBe(user.id);

      const foundUser = await userRepository.getUserById(user.id);
      expect(foundUser).toBeUndefined();
    });

    it('should return undefined when trying to delete non-existent user', async () => {
      const result = await userRepository.deleteUser('non-existent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const user = await userRepository.create({ email, name, password });

      expect(user.email).toBe(email);
      expect(user.name).toBe(name);

      expect(1).toBe(1); // Placeholder for actual test logic
    });

    it('should not return password in create response', async () => {
      const user = await userRepository.create({ email, name, password });

      expect(user).not.toHaveProperty('password');
    });

    it('should generate unique IDs for different users', async () => {
      const user1 = await userRepository.create({
        email: 'user1@test.com',
        name: 'User 1',
        password,
      });
      const user2 = await userRepository.create({
        email: 'user2@test.com',
        name: 'User 2',
        password,
      });

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      await userRepository.create({ email, name, password });

      const user = await userRepository.findByEmail(email);

      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.name).toBe(name);
    });

    it('should return undefined for non-existent email', async () => {
      const user = await userRepository.findByEmail('non-existent@email.com');

      expect(user).toBeUndefined();
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const user = await userRepository.create({ email, name, password });

      const newHashedPassword = 'newpassword123';

      await userRepository.updateUserPassword(user.id, newHashedPassword);

      const updatedUser = await userRepository.getUserByIdWithPassword(user.id);

      expect(updatedUser?.password).toBe(newHashedPassword);
    });

    it.todo('should handle database errors when updating user password');
    it.todo('should handle updating password for non-existent user');
  });

  describe('getAll', () => {
    it.todo('should return all users from database');
    it.todo('should return empty array when no users exist');
    it.todo('should handle database errors when getting all users');
    it.todo('should not return passwords in getAll response');
  });

  // Additional edge case tests
  describe('edge cases', () => {
    it.todo('should handle concurrent user creation with same email');
    it.todo('should handle very long email addresses');
    it.todo('should handle special characters in user name');
    it.todo('should handle empty string values in updateUserProfile');
    it.todo('should validate email format during creation');
  });
});
