type HttpClientConfig = {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  responseType?: string;
};

export const httpClient = async <T>(
  { url, method, params, data, headers, signal }: HttpClientConfig,
  _options?: unknown,
): Promise<T> => {
  const searchParams = params
    ? '?' + new URLSearchParams(params as Record<string, string>).toString()
    : '';

  const response = await fetch(`${url}${searchParams}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};