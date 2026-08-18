import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'node:http';

import { UUID } from '@ledgerly/shared/types';
import type { createServer } from 'src/presentation/http/server';

type TestServer = ReturnType<typeof createServer>;
type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
type InjectPayload = string | object | Buffer | NodeJS.ReadableStream;
type AuthTokenPayload = {
  email: string;
  userId: UUID;
};

const defaultTestTokenExpiresIn = '1h';

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

  const injectUnauthenticated = async (options: HttpTestInjectOptions) => {
    return await server.inject(options);
  };

  const parseResponse = <TResponse>(response: { body: string }) => {
    return JSON.parse(response.body) as TResponse;
  };

  const registerAndGetToken = async (payload: InjectPayload) => {
    const response = await server.inject({
      method: 'POST',
      payload,
      url: '/api/auth/register',
    });

    return parseResponse<{ token: string }>(response);
  };

  const signAuthToken = (
    payload: AuthTokenPayload,
    options?: Parameters<TestServer['jwt']['sign']>[1],
  ) =>
    server.jwt.sign(payload, {
      expiresIn: defaultTestTokenExpiresIn,
      ...(options ?? {}),
    });

  return {
    injectAuthorized,
    injectUnauthenticated,
    injectWithToken,
    parseResponse,
    registerAndGetToken,
    signAuthToken,
  };
};

export type InjectAuthorized = ReturnType<
  typeof createHttpTestClient
>['injectAuthorized'];

export type HttpTestClient = ReturnType<typeof createHttpTestClient>;

export type InjectWithToken = ReturnType<
  typeof createHttpTestClient
>['injectWithToken'];

export type InjectUnauthenticated = ReturnType<
  typeof createHttpTestClient
>['injectUnauthenticated'];

export type ParseResponse = ReturnType<
  typeof createHttpTestClient
>['parseResponse'];
