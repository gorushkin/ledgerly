import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'node:http';

import type { createServer } from 'src/presentation/http/server';

type TestServer = ReturnType<typeof createServer>;
type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
type InjectPayload = string | object | Buffer | NodeJS.ReadableStream;

export type HttpTestInjectOptions = {
  headers?: IncomingHttpHeaders | OutgoingHttpHeaders;
  method: HttpMethod;
  payload?: InjectPayload;
  query?: string | Record<string, string | string[]>;
  url: string;
};

export const createHttpTestClient = (
  server: TestServer,
  getAuthToken: () => string,
) => {
  const injectWithToken = async (
    token: string,
    options: HttpTestInjectOptions,
  ) => {
    return await server.inject({
      ...options,
      headers: {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const injectAuthorized = async (options: HttpTestInjectOptions) => {
    return await injectWithToken(getAuthToken(), options);
  };

  return {
    injectAuthorized,
    injectWithToken,
  };
};
