type HttpClientConfig = {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  responseType?: string;
};

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const payload = await response.json();

      if (payload && typeof payload === 'object' && 'message' in payload) {
        const message = payload.message;

        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    } else {
      const text = await response.text();

      if (text.trim()) {
        return text;
      }
    }
  } catch {
    return `${response.status} ${response.statusText}`;
  }

  return `${response.status} ${response.statusText}`;
}

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
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};
