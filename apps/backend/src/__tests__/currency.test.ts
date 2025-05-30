import { createTestDb } from 'src/db/test-db';
import { createServer } from 'src/presentation/server';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Currency Tests', () => {
  const { cleanupTestDb, db, setupTestDb } = createTestDb();
  const server = createServer(db);

  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('GET /currencies', () => {
    it('should return all available currencies', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/currencies',
      });
      expect(res.statusCode).toBe(200);

      const data = JSON.parse(res.body) as { code: string }[];
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('code');
      expect(data.length).toEqual(8);
    });
  });
});
