import bcrypt from 'bcryptjs';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { describe, vi, beforeEach, expect, it, type Mock } from 'vitest';

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    getRounds: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('PasswordManager', () => {
  let passwordManager: PasswordManager;
  const testPassword = 'test_password';
  const hashedPassword = 'hashed_password';
  const defaultRounds = 10;

  beforeEach(() => {
    vi.clearAllMocks();
    passwordManager = new PasswordManager();
  });

  describe('hash', () => {
    it('should hash password with default rounds', async () => {
      (bcrypt.hash as Mock).mockResolvedValue(hashedPassword);

      const result = await passwordManager.hash(testPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(testPassword, defaultRounds);
      expect(result).toBe(hashedPassword);
    });

    it('should hash password with custom rounds', async () => {
      const customRounds = 12;
      passwordManager = new PasswordManager(customRounds);
      (bcrypt.hash as Mock).mockResolvedValue(hashedPassword);

      const result = await passwordManager.hash(testPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(testPassword, customRounds);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('compare', () => {
    it('should return true for matching passwords', async () => {
      (bcrypt.compare as Mock).mockResolvedValue(true);

      const result = await passwordManager.compare(
        testPassword,
        hashedPassword,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(testPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      (bcrypt.compare as Mock).mockResolvedValue(false);

      const result = await passwordManager.compare(
        testPassword,
        hashedPassword,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(testPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('verify', () => {
    it('should return true for valid bcrypt hash', () => {
      const validHash = '$2a$10$hashedpassword';
      const result = passwordManager.verify(validHash);
      expect(result).toBe(true);
    });

    it('should return false for invalid hash', () => {
      const invalidHash = 'invalid_hash';
      const result = passwordManager.verify(invalidHash);
      expect(result).toBe(false);
    });
  });

  describe('rehash', () => {
    beforeEach(() => {
      (bcrypt.getRounds as Mock).mockReturnValue(defaultRounds);
      (bcrypt.hash as Mock).mockResolvedValue(hashedPassword);
    });

    it('should return null for invalid hash', async () => {
      const invalidHash = 'invalid_hash';
      const result = await passwordManager.rehash(invalidHash);
      expect(result).toBeNull();
    });

    it('should return same hash if rounds match', async () => {
      const validHash = '$2a$10$hashedpassword';
      const result = await passwordManager.rehash(validHash);
      expect(result).toBe(validHash);
    });

    it('should rehash if rounds differ', async () => {
      const validHash = '$2a$10$hashedpassword';
      (bcrypt.getRounds as Mock).mockReturnValue(8);

      const result = await passwordManager.rehash(validHash);

      expect(bcrypt.hash).toHaveBeenCalledWith(validHash, defaultRounds);
      expect(result).toBe(hashedPassword);
    });
  });
});
