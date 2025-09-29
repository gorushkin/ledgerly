import { UUID } from '@ledgerly/shared/types';
import { describe, expect, it } from 'vitest';

import { Entry } from './entry.entity.js';

describe('Entry', () => {
  const transactionId = 'transaction-123' as UUID;

  describe('create', () => {
    it('should create a new entry with required data', () => {
      const entry = Entry.create({ transactionId });

      expect(entry.id).toBeNull();
      expect(entry.transactionId).toBe(transactionId);
      expect(entry.description).toBe('');
      expect(entry.isNew).toBe(true);
      expect(entry.canBeModified).toBe(true);
    });

    it('should create entry with description', () => {
      const description = 'Test entry description';
      const entry = Entry.create({ description, transactionId });

      expect(entry.description).toBe(description);
    });

    it('should trim description', () => {
      const entry = Entry.create({
        description: '  Test description  ',
        transactionId,
      });

      expect(entry.description).toBe('Test description');
    });

    it('should throw error for missing transaction ID', () => {
      expect(() => Entry.create({ transactionId: '' as UUID })).toThrow(
        'Transaction ID is required',
      );
    });

    it('should throw error for description too long', () => {
      const longDescription = 'a'.repeat(256);

      expect(() =>
        Entry.create({ description: longDescription, transactionId }),
      ).toThrow('Description cannot exceed 255 characters');
    });

    it('should allow exactly 255 characters', () => {
      const maxDescription = 'a'.repeat(255);
      const entry = Entry.create({
        description: maxDescription,
        transactionId,
      });

      expect(entry.description).toBe(maxDescription);
    });
  });

  describe.skip('restore', () => {
    it('should restore entry from data', () => {
      const data = {
        createdAt: new Date('2023-01-01'),
        description: 'Restored entry',
        id: 'entry-456' as UUID,
        transactionId,
        updatedAt: new Date('2023-01-02'),
      };

      const entry = Entry.restore(data);

      expect(entry.id).toBe(data.id);
      expect(entry.transactionId).toBe(data.transactionId);
      expect(entry.description).toBe(data.description);
      expect(entry.createdAt).toBe(data.createdAt);
      expect(entry.updatedAt).toBe(data.updatedAt);
      expect(entry.isNew).toBe(false);
    });

    it('should restore entry with empty description', () => {
      const data = {
        createdAt: new Date('2023-01-01'),
        id: 'entry-456' as UUID,
        transactionId,
        updatedAt: new Date('2023-01-02'),
      };

      const entry = Entry.restore(data);

      expect(entry.description).toBe('');
    });

    it('should trim description when restoring', () => {
      const data = {
        createdAt: new Date('2023-01-01'),
        description: '  Restored entry  ',
        id: 'entry-456' as UUID,
        transactionId,
        updatedAt: new Date('2023-01-02'),
      };

      const entry = Entry.restore(data);

      expect(entry.description).toBe('Restored entry');
    });

    it('should throw error for missing ID', () => {
      expect(() =>
        Entry.restore({
          createdAt: new Date(),
          id: null,
          transactionId,
          updatedAt: new Date(),
        }),
      ).toThrow('ID is required for existing entry');
    });

    it('should throw error for missing transaction ID', () => {
      expect(() =>
        Entry.restore({
          createdAt: new Date(),
          id: 'entry-456' as UUID,
          transactionId: '' as UUID,
          updatedAt: new Date(),
        }),
      ).toThrow('Transaction ID is required');
    });

    it('should throw error for missing creation date', () => {
      expect(() =>
        Entry.restore({
          id: 'entry-456' as UUID,
          transactionId,
          updatedAt: new Date(),
        } as any),
      ).toThrow('Creation date is required for existing entry');
    });

    it('should throw error for missing update date', () => {
      expect(() =>
        Entry.restore({
          createdAt: new Date(),
          id: 'entry-456' as UUID,
          transactionId,
        } as any),
      ).toThrow('Update date is required for existing entry');
    });
  });

  describe.skip('updateDescription', () => {
    it('should update description', () => {
      const entry = Entry.create({
        description: 'Old description',
        transactionId,
      });
      const newDescription = 'New description';

      entry.updateDescription(newDescription);

      expect(entry.description).toBe(newDescription);
    });

    it('should trim description', () => {
      const entry = Entry.create({ transactionId });

      entry.updateDescription('  New description  ');

      expect(entry.description).toBe('New description');
    });

    it('should update updatedAt timestamp', () => {
      const entry = Entry.create({ transactionId });
      const initialUpdatedAt = entry.updatedAt;

      // Небольшая задержка для гарантии изменения времени
      setTimeout(() => {
        entry.updateDescription('Updated');

        expect(entry.updatedAt.getTime()).toBeGreaterThan(
          initialUpdatedAt.getTime(),
        );
      }, 1);
    });

    it('should throw error for empty description', () => {
      const entry = Entry.create({ transactionId });

      expect(() => entry.updateDescription('')).toThrow(
        'Description cannot be empty',
      );
      expect(() => entry.updateDescription('   ')).toThrow(
        'Description cannot be empty',
      );
    });

    it('should throw error for description too long', () => {
      const entry = Entry.create({ transactionId });
      const longDescription = 'a'.repeat(256);

      expect(() => entry.updateDescription(longDescription)).toThrow(
        'Description cannot exceed 255 characters',
      );
    });

    it('should allow exactly 255 characters', () => {
      const entry = Entry.create({ transactionId });
      const maxDescription = 'a'.repeat(255);

      entry.updateDescription(maxDescription);

      expect(entry.description).toBe(maxDescription);
    });
  });

  describe.skip('toData', () => {
    it('should serialize new entry to data', () => {
      const entry = Entry.create({
        description: 'Test description',
        transactionId,
      });
      const data = entry.toData();

      expect(data.id).toBeNull();
      expect(data.transactionId).toBe(transactionId);
      expect(data.description).toBe('Test description');
      expect(data.createdAt).toBeInstanceOf(Date);
      expect(data.updatedAt).toBeInstanceOf(Date);
    });

    it('should serialize existing entry to data', () => {
      const originalData = {
        createdAt: new Date('2023-01-01'),
        description: 'Test entry',
        id: 'entry-456' as UUID,
        transactionId,
        updatedAt: new Date('2023-01-02'),
      };

      const entry = Entry.restore(originalData);
      const data = entry.toData();

      expect(data).toEqual(originalData);
    });

    it('should serialize entry with empty description', () => {
      const entry = Entry.create({ transactionId });
      const data = entry.toData();

      expect(data.description).toBeUndefined();
    });

    it('should serialize entry with whitespace-only description as undefined', () => {
      const entry = Entry.create({ description: '', transactionId });
      const data = entry.toData();

      expect(data.description).toBeUndefined();
    });
  });

  describe.skip('equals', () => {
    it('should return true for entries with same ID', () => {
      const id = 'entry-123' as UUID;
      const entry1 = Entry.restore({
        createdAt: new Date(),
        description: 'Entry 1',
        id,
        transactionId,
        updatedAt: new Date(),
      });
      const entry2 = Entry.restore({
        createdAt: new Date(),
        description: 'Entry 2',
        id,
        transactionId: 'other-transaction' as UUID,
        updatedAt: new Date(),
      });

      expect(entry1.equals(entry2)).toBe(true);
    });

    it('should return false for entries with different IDs', () => {
      const entry1 = Entry.restore({
        createdAt: new Date(),
        id: 'entry-1' as UUID,
        transactionId,
        updatedAt: new Date(),
      });
      const entry2 = Entry.restore({
        createdAt: new Date(),
        id: 'entry-2' as UUID,
        transactionId,
        updatedAt: new Date(),
      });

      expect(entry1.equals(entry2)).toBe(false);
    });

    it('should compare by content for new entries', () => {
      const entry1 = Entry.create({
        description: 'Same description',
        transactionId,
      });
      const entry2 = Entry.create({
        description: 'Same description',
        transactionId,
      });
      const entry3 = Entry.create({
        description: 'Different description',
        transactionId,
      });

      expect(entry1.equals(entry2)).toBe(true);
      expect(entry1.equals(entry3)).toBe(false);
    });

    it('should return false for new entry vs existing entry', () => {
      const newEntry = Entry.create({ description: 'Test', transactionId });
      const existingEntry = Entry.restore({
        createdAt: new Date(),
        description: 'Test',
        id: 'entry-123' as UUID,
        transactionId,
        updatedAt: new Date(),
      });

      expect(newEntry.equals(existingEntry)).toBe(false);
    });
  });

  describe.skip('business logic', () => {
    it('should have correct isNew property for new entry', () => {
      const entry = Entry.create({ transactionId });

      expect(entry.isNew).toBe(true);
    });

    it('should have correct isNew property for existing entry', () => {
      const entry = Entry.restore({
        createdAt: new Date(),
        id: 'entry-123' as UUID,
        transactionId,
        updatedAt: new Date(),
      });

      expect(entry.isNew).toBe(false);
    });

    it('should always allow modifications', () => {
      const newEntry = Entry.create({ transactionId });
      const existingEntry = Entry.restore({
        createdAt: new Date(),
        id: 'entry-123' as UUID,
        transactionId,
        updatedAt: new Date(),
      });

      expect(newEntry.canBeModified).toBe(true);
      expect(existingEntry.canBeModified).toBe(true);
    });
  });
});
