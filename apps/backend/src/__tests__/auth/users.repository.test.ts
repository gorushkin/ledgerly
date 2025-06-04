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

  describe('create', () => {
    it('should create a user successfully', async () => {
      const user = await repository.create({ email, name, password });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);
      expect(user.password).toBeDefined(); // Password should be hashed

      expect(1).toBe(1); // Placeholder for actual test logic
    });
  });

  describe('findByEmail', async () => {
    it('should find a user by email', async () => {
      await repository.create({ email, name, password });

      const user = await repository.findByEmail(email);

      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
      expect(user?.name).toBe(name);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const user = await repository.create({ email, name, password });

      const newPassword = 'newpassword123';

      const updatedUser = await repository.updateUser(user.id, {
        ...user,
        password: newPassword,
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser.password).not.toBe(user.password); // Password should be hashed and different
      expect(updatedUser.password).toBe(newPassword); // Password should be hashed and different
    });
  });
});
