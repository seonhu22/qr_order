// Preserve the numeric server response and existing snake/camel-case mock shapes.
export function getPasswordFailCount(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return undefined;
  }
  const data = (payload as { data?: unknown }).data;
  if (typeof data === 'number') return data;
  if (typeof data === 'string') {
    const count = Number(data);
    return Number.isFinite(count) ? count : undefined;
  }
  if (!data || typeof data !== 'object') return undefined;
  const count = 'password_fail_cnt' in data
    ? data.password_fail_cnt
    : 'passwordFailCnt' in data ? data.passwordFailCnt : undefined;
  if (typeof count === 'number') return count;
  if (typeof count === 'string') {
    const parsed = Number(count);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function isLockedLoginMessage(message: unknown): boolean {
  return typeof message === 'string'
    && message.includes('비밀번호 5회')
    && message.includes('사용 중지');
}
