import { UUID } from '@ledgerly/shared/types';
import { TestDB } from 'src/db/test-db';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { Operation } from '../../../domain/operations:toRefactor/operation.entity';
import { OperationRepositoryImpl } from '../OperationRepositoryImpl';

import { cleanupTestDatabase } from './shared/test-database';
import {
  createTestUser,
  createTestAccount,
  createTestEntry,
} from './shared/test-fixtures';

describe('OperationRepositoryImpl Integration Tests', () => {
  let repository: OperationRepositoryImpl;
  let db: any;
  let testUserId: UUID;
  let testAccountId: UUID;
  let testEntryId: UUID;
  let testDB: TestDB;

  beforeEach(async () => {
    // Создаем тестовую БД
    testDB = new TestDB();
    await testDB.setupTestDb();

    repository = new OperationRepositoryImpl(testDB.db);

    // Создаем тестовые данные
    testUserId = await createTestUser(db);
    testAccountId = await createTestAccount(db, testUserId);
    testEntryId = await createTestEntry(db, testUserId);
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
  });

  describe('create()', () => {
    it('should create a new operation successfully', async () => {
      // Arrange
      const operation = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any, // Money type
        'debit',
        'Test operation',
      );

      // Act
      const result = await repository.create(testUserId, operation);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.entryId).toBe(testEntryId);
      expect(result.accountId).toBe(testAccountId);
      expect(result.amount).toBe(1000);
      expect(result.type).toBe('debit');
      expect(result.description).toBe('Test operation');
      expect(result.isNew()).toBe(false);
    });

    it('should throw error when userId is invalid', async () => {
      // Arrange
      const operation = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'debit',
      );

      // Act & Assert
      await expect(repository.create('' as UUID, operation)).rejects.toThrow(
        'User ID is required for operation access',
      );
    });
  });

  describe('getById()', () => {
    it('should return operation when it exists', async () => {
      // Arrange
      const operation = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'credit',
        'Test operation',
      );
      const created = await repository.create(testUserId, operation);

      // Act
      const result = await repository.getById(testUserId, created.id!);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.amount).toBe(1000);
      expect(result!.type).toBe('credit');
    });

    it('should return null when operation does not exist', async () => {
      // Act
      const result = await repository.getById(
        testUserId,
        'non-existent-id' as UUID,
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should not return operation from different user', async () => {
      // Arrange
      const anotherUserId = await createTestUser(db);
      const operation = Operation.create(
        anotherUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'debit',
      );
      const created = await repository.create(anotherUserId, operation);

      // Act
      const result = await repository.getById(testUserId, created.id!);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update()', () => {
    it('should update existing operation', async () => {
      // Arrange
      const operation = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'debit',
        'Original description',
      );
      const created = await repository.create(testUserId, operation);

      // Создаем операцию для обновления (имитируем изменения в домене)
      const updatedOperation = Operation.restore(
        created.userId,
        created.id!,
        created.entryId,
        created.accountId,
        2000 as any, // Новая сумма
        'credit', // Новый тип
        created.isSystem,
        'Updated description', // Новое описание
      );

      // Act
      const result = await repository.update(testUserId, updatedOperation);

      // Assert
      expect(result.id).toBe(created.id);
      expect(result.amount).toBe(2000);
      expect(result.type).toBe('credit');
      expect(result.description).toBe('Updated description');
    });

    it('should throw error when trying to update new operation', async () => {
      // Arrange
      const newOperation = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'debit',
      );

      // Act & Assert
      await expect(repository.update(testUserId, newOperation)).rejects.toThrow(
        'Cannot update a new operation. Use create instead.',
      );
    });
  });

  describe('getAllByEntryId()', () => {
    it('should return all operations for entry', async () => {
      // Arrange
      const operation1 = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'debit',
      );
      const operation2 = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'credit',
      );

      await repository.create(testUserId, operation1);
      await repository.create(testUserId, operation2);

      // Act
      const result = await repository.getAllByEntryId(testUserId, testEntryId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result.some((op) => op.type === 'debit')).toBe(true);
      expect(result.some((op) => op.type === 'credit')).toBe(true);
      expect(result.every((op) => op.entryId === testEntryId)).toBe(true);
    });

    it('should return empty array when no operations exist', async () => {
      // Act
      const result = await repository.getAllByEntryId(testUserId, testEntryId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete()', () => {
    it('should delete existing operation', async () => {
      // Arrange
      const operation = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'debit',
      );
      const created = await repository.create(testUserId, operation);

      // Act
      const result = await repository.delete(testUserId, created.id!);

      // Assert
      expect(result).toBe(true);

      // Verify operation is deleted
      const found = await repository.getById(testUserId, created.id!);
      expect(found).toBeNull();
    });

    it('should return false when operation does not exist', async () => {
      // Act
      const result = await repository.delete(
        testUserId,
        'non-existent-id' as UUID,
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('exists()', () => {
    it('should return true when operation exists', async () => {
      // Arrange
      const operation = Operation.create(
        testUserId,
        testEntryId,
        testAccountId,
        1000 as any,
        'debit',
      );
      const created = await repository.create(testUserId, operation);

      // Act
      const result = await repository.exists(testUserId, created.id!);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when operation does not exist', async () => {
      // Act
      const result = await repository.exists(
        testUserId,
        'non-existent-id' as UUID,
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('validation', () => {
    it('should validate required parameters consistently', async () => {
      const invalidUserId = '' as UUID;
      const validOperationId = 'valid-id' as UUID;

      // Проверяем, что все методы валидируют одинаково
      await expect(
        repository.getById(invalidUserId, validOperationId),
      ).rejects.toThrow('User ID is required for operation access');

      await expect(
        repository.delete(invalidUserId, validOperationId),
      ).rejects.toThrow('User ID is required for operation access');

      await expect(
        repository.exists(invalidUserId, validOperationId),
      ).rejects.toThrow('User ID is required for operation access');
    });
  });
});
