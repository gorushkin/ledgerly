import { CreateEntryRequestDTO } from 'src/application';
import { EntryRepositoryInterface } from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { createTransaction, createUser } from 'src/db/createTestUser';
import { Entry, Operation } from 'src/domain';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { EntryFactory } from '../entry.factory';
import { OperationFactory } from '../operation.factory';

describe('EntryFactory', () => {
  let user: Awaited<ReturnType<typeof createUser>>;
  let transaction: ReturnType<typeof createTransaction>;

  let entryFactory: EntryFactory;

  let mockCreateOperationService: {
    createOperationsForEntry: ReturnType<typeof vi.fn>;
  };

  let mockEntryRepository: {
    create: ReturnType<typeof vi.fn>;
  };

  let mockSaveWithIdRetry: SaveWithIdRetryType;

  const mockOperations = [] as unknown as Operation[];

  beforeAll(async () => {
    user = await createUser();
    transaction = createTransaction(user);
  });

  beforeEach(() => {
    mockCreateOperationService = {
      createOperationsForEntry: vi.fn().mockResolvedValue(mockOperations),
    };

    mockEntryRepository = {
      create: vi.fn(),
    };

    mockSaveWithIdRetry = vi.fn().mockResolvedValue({ name: 'mocked entry' });

    entryFactory = new EntryFactory(
      mockCreateOperationService as unknown as OperationFactory,
      mockEntryRepository as unknown as EntryRepositoryInterface,
      mockSaveWithIdRetry as unknown as SaveWithIdRetryType,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create entries with operations', async () => {
    const mockAddOperations = vi.fn();

    const mockResult = {
      addOperations: mockAddOperations,
    } as unknown as Entry;

    vi.spyOn(Entry, 'create').mockReturnValue(mockResult);

    const operations = [
      { data: 'mocked operation 1' },
      { data: 'mocked operation 2' },
    ] as unknown as Operation[];

    const rawEntries: CreateEntryRequestDTO[] = [
      { operations } as unknown as CreateEntryRequestDTO,
    ];

    const result = await entryFactory.createEntriesWithOperations(
      user,
      transaction,
      rawEntries,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Entry.create).toHaveBeenCalledWith(user, transaction);

    expect(mockAddOperations).toHaveBeenCalledWith(mockOperations);

    expect(result).toEqual([mockResult]);
  });

  it('should save entry using saveWithIdRetry', async () => {
    const operations = [
      { data: 'mocked operation 1' },
      { data: 'mocked operation 2' },
    ] as unknown as Operation[];

    const rawEntries: CreateEntryRequestDTO[] = [
      { operations } as unknown as CreateEntryRequestDTO,
      { operations } as unknown as CreateEntryRequestDTO,
    ];

    const mockedEntries = [
      { addOperations: vi.fn() },
      { addOperations: vi.fn() },
    ] as unknown as Entry[];

    vi.spyOn(Entry, 'create').mockReturnValueOnce(mockedEntries[0]);
    vi.spyOn(Entry, 'create').mockReturnValueOnce(mockedEntries[1]);

    await entryFactory.createEntriesWithOperations(
      user,
      transaction,
      rawEntries,
    );

    expect(mockSaveWithIdRetry).toHaveBeenCalledTimes(rawEntries.length);

    const testData = (
      mockSaveWithIdRetry as unknown as { mock: { calls: unknown[] } }
    ).mock.calls as unknown as [
      Entry,
      (entry: Entry) => Promise<Entry>,
      () => Entry,
    ][];

    testData.forEach(
      (
        [entry, repoArg, createFn]: [
          Entry,
          (entry: Entry) => Promise<Entry>,
          () => Entry,
        ],
        index: number,
      ) => {
        expect(entry).toBe(mockedEntries[index]);
        expect(typeof repoArg).toBe('function');
        expect(typeof createFn).toBe('function');
        const createdEntry = createFn();
        expect(createdEntry).toBeInstanceOf(Entry);
      },
    );
  });
});
