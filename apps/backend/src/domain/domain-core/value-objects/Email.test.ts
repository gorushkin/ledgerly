import { describe, expect, it } from 'vitest';

import { Email } from './Email';

describe('Email Value Object', () => {
  describe('create method', () => {
    it('should create valid email', () => {
      const email = Email.create('test@example.com');

      expect(email.valueOf()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');

      expect(email.valueOf()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');

      expect(email.valueOf()).toBe('test@example.com');
    });

    it('should throw error for invalid email formats', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'test@',
        'test.example.com',
        'test@example.',
        '.test@example.com',
        'test.@example.com',
        'test@.example.com',
        'test@example.com.',
        'test..test@example.com',
        'test@example..com',
      ];

      invalidEmails.forEach((invalidEmail) => {
        expect(() => Email.create(invalidEmail)).toThrow(
          'Invalid email format',
        );
      });
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user_name@example.co.uk',
        'test123@example-domain.com',
        'a@b.co',
      ];

      validEmails.forEach((validEmail) => {
        expect(() => Email.create(validEmail)).not.toThrow();
      });
    });
  });

  describe('fromPersistence method', () => {
    it('should restore email from persistence', () => {
      const email = Email.fromPersistence('test@example.com');

      expect(email.valueOf()).toBe('test@example.com');
    });
  });

  describe('isEqualTo method', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.isEqualTo(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');

      expect(email1.isEqualTo(email2)).toBe(false);
    });

    it('should handle case normalization', () => {
      const email1 = Email.create('TEST@example.com');
      const email2 = Email.create('test@example.com');

      expect(email1.isEqualTo(email2)).toBe(true);
    });
  });

  describe('serialization methods', () => {
    it('should serialize to string correctly', () => {
      const email = Email.create('test@example.com');

      expect(email.valueOf()).toBe('test@example.com');
      expect(email.toPersistence()).toBe('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });

  describe('immutability', () => {
    it('should be frozen (immutable)', () => {
      const email = Email.create('test@example.com');

      expect(Object.isFrozen(email)).toBe(true);
    });
  });
});
