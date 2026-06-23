import { HttpError } from '@/shared/lib/httpClient';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

export function getSignupApiErrorMessage(
  error: unknown,
  fallback = '서버 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
): string {
  if (
    error instanceof HttpError &&
    isRecord(error.payload) &&
    typeof error.payload.message === 'string' &&
    error.payload.message.trim()
  ) {
    return error.payload.message;
  }

  if (error instanceof HttpError && error.message.trim()) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
