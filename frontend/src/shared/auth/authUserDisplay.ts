type AuthUserLike = Record<string, unknown> | null | undefined;

/**
 * 사용자 객체에서 지정된 키 중 첫 번째 문자열 값을 반환합니다.
 * @param user - 사용자 객체
 * @param keys - 검색할 키 배열
 * @returns 찾은 문자열 값 또는 undefined
 */
function getStringField(user: AuthUserLike, keys: string[]): string | undefined {
  if (!user || typeof user !== 'object') {
    return undefined;
  }

  for (const key of keys) {
    const value = user[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

/**
 * 인증 사용자의 표시 이름을 가져옵니다.
 * @param user - 사용자 객체
 * @param fallback - 기본값 (기본값: '사용자')
 * @returns 사용자 표시 이름
 */
export function getAuthUserDisplayName(user: AuthUserLike, fallback = '사용자') {
  return (
    getStringField(user, ['userName', 'userNm', 'name']) ??
    getStringField(user, ['userId', 'id']) ??
    fallback
  );
}

/**
 * 인증 사용자의 역할 레이블을 가져옵니다.
 * @param user - 사용자 객체
 * @param fallback - 기본값 (기본값: '사용자')
 * @returns 사용자 역할 레이블
 */
export function getAuthUserRoleLabel(user: AuthUserLike, fallback = '사용자') {
  return getStringField(user, ['role', 'userRole', 'sysPlantCd']) ?? fallback;
}
