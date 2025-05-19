import { envConfig } from '../config/config';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const path = '/api'; // Define your API versioning here

const apiConfig = {
  baseUrl: (url: string) => `${path}${url}`,
  createAbortController: () => new AbortController(), // Utility to create a new AbortController
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${envConfig.API_TOKEN}`,
  } as Record<string, string>,
  method: 'GET' as HttpMethod, // Default HTTP method
  timeout: 5000, // Timeout in milliseconds
};

type Response<T> = { data: T; ok: true } | { error: string; ok: false };

export const fetchWrapper = async <T>(
  path: string,
  options: RequestInit = {},
  controller?: AbortController // Optional external AbortController
): Promise<Response<T>> => {
  const url = apiConfig.baseUrl(path);

  const abortController = controller ?? apiConfig.createAbortController();
  const timeoutId = setTimeout(() => abortController.abort(), apiConfig.timeout);

  try {
    const headers: Record<string, string> = {
      ...apiConfig.headers,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { data: (await response.json()) as T, ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export type BaseActions<T, D = T> = {
  create: (data: D) => Promise<Response<T>>;
  read: () => Promise<Response<T[]>>;
  update: (id: string, data: D) => Promise<Response<T>>;
  delete: (id: string) => Promise<Response<T>>;
};

export const baseActions = <T, D = T>(url: string): BaseActions<T, D> => ({
  create: async (data) => {
    return await fetchWrapper(url, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  },
  delete: async (id: string) => {
    return await fetchWrapper(`${url}/${id}`, {
      method: 'DELETE',
    });
  },
  read: async () => {
    return await fetchWrapper(url);
  },
  update: async (id: string, data) => {
    return await fetchWrapper(`${url}/${id}`, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    });
  },
});
