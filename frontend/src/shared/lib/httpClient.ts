/**
 * @fileoverview Orval 생성 API 함수가 공유하는 fetch 클라이언트.
 *
 * 401 응답은 인증 만료 이벤트로 알리고, 호출부에는 상태 정보를 가진 HttpError를 던진다.
 */
import { notifyUnauthorized } from '@/shared/auth/authRedirect';

type HttpClientConfig = {
  url: string;
  method: string;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  responseType?: string;
};

export class HttpError extends Error {
  status: number;
  statusText: string;
  url: string;

  constructor(message: string, response: Response, url: string) {
    super(message);
    this.name = 'HttpError';
    this.status = response.status;
    this.statusText = response.statusText;
    this.url = url;
  }
}

function shouldNotifyUnauthorized(url: string): boolean {
  // auth API의 401은 초기 인증 확인/로그인 실패 흐름에서 직접 처리한다.
  return !url.startsWith('/api/auth/');
}

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
    const message = await readErrorMessage(response);

    if (response.status === 401 && shouldNotifyUnauthorized(url)) {
      notifyUnauthorized({ message });
    }

    throw new HttpError(message, response, url);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};
