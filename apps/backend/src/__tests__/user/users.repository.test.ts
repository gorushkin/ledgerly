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

      expect(user.email).toBe(email);
      expect(user.name).toBe(name);

      expect(1).toBe(1); // Placeholder for actual test logic
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
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const user = await repository.create({ email, name, password });

      const newPassword = 'newpassword123';
      const newName = 'Test User Updated';
      const newEmail = 'qwe@qwe.com';

      const updatedUser = await repository.updateUser(user.id, {
        email: newEmail,
        name: newName,
        password: newPassword,
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser.name).toBe(newName);

      expect(updatedUser.email).toBe(newEmail);
    });
  });
});
