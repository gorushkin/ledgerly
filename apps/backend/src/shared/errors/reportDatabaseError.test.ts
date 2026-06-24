import { describe, expect, it, vi } from 'vitest';

import { reportDatabaseError } from './reportDatabaseError';

describe('reportDatabaseError', () => {
  it('reports a database error once outside the HTTP layer', () => {
    const error = new Error('connection reset');
    const logError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.stubEnv('NODE_ENV', 'production');

    try {
      reportDatabaseError(error);
      reportDatabaseError(error);

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('Database error:', error);
    } finally {
      logError.mockRestore();
      vi.unstubAllEnvs();
    }
  });
});
