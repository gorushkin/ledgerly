import { ROUTES } from '@ledgerly/shared/routes';
import { UUID } from '@ledgerly/shared/types';
import { TestDB } from 'src/db/test-db';
import { Id } from 'src/domain/domain-core';
import { createServer } from 'src/presentation/http';
import { beforeEach, describe, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const url = `/api${ROUTES.commodities}`;

const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'Password123!',
};

describe('Commodities Integration Tests', () => {
  let testDB: TestDB;
  let server: ReturnType<typeof createServer>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authToken: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userId: UUID;

  beforeEach(async () => {
    testDB = new TestDB();
    server = createServer(testDB.db);
    await testDB.setupTestDb();

    await server.ready();

    const user = await testDB.createUser(testUser);

    const token = server.jwt.sign({
      email: user.email,
      userId: user.id,
    });

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = Id.restore(decoded.userId).valueOf();
  });

  describe('GET /api/commodities', () => {
    it.todo('should return all commodities for the authenticated user');

    it.todo('should not return commodities belonging to another user');

    it.todo('should include archived commodities marked as archived');

    it.todo('should return 401 without authorization');
  });

  describe('GET /api/commodities/:id', () => {
    it.todo('should return a commodity by id for the authenticated user');

    it.todo('should return an archived commodity by id marked as archived');

    it.todo('should return 404 when the commodity does not exist');

    it.todo('should return 404 when the commodity belongs to another user');

    it.todo('should return 400 when the commodity id is invalid');

    it.todo('should return 401 without authorization');
  });

  describe('POST /api/commodities', () => {
    it.todo('should create a commodity for the authenticated user');

    it.todo('should create a commodity with default precision and null symbol');

    it.todo('should reject duplicate code for the same user');

    it.todo('should allow the same code for different users');

    it.todo('should return 400 for invalid payload');

    it.todo('should return 401 without authorization');
  });

  describe('PUT /api/commodities/:id', () => {
    it.todo('should update editable commodity metadata');

    it.todo('should reject duplicate code for the same user');

    it.todo('should allow updating to a code used by another user');

    it.todo('should return 404 when updating another user commodity');

    it.todo('should return 404 when updating an archived commodity');

    it.todo('should return 400 for invalid params');

    it.todo('should return 400 for invalid payload');

    it.todo('should return 401 without authorization');
  });

  describe('DELETE /api/commodities/:id', () => {
    it.todo('should archive a commodity by id');

    it.todo('should leave the archived commodity readable by id');

    it.todo(
      'should return the archived commodity in the list marked as archived',
    );

    it.todo('should return 404 when archiving another user commodity');

    it.todo('should return 404 when archiving an already archived commodity');

    it.todo('should return 400 when the commodity id is invalid');

    it.todo('should return 401 without authorization');
  });
});
