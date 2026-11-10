//src/shared/auth/authResponse.ts

/**
 * 인증 응답 페이로드에서 사용자 정보를 추출합니다.
 *
 * @param {Object} payload - 인증 응답 페이로드
 * @param {boolean} payload.success - 인증 성공 여부
 * @param {Object} [payload.user] - 사용자 정보
 * @param {Object} [payload.data] - 사용자 데이터
 * @returns {Object|null} 사용자 정보 또는 null
 */

interface AuthPayload {
  success?: boolean;
  user?: unknown;
  data?: unknown;
}

export function resolveAuthUser(payload: AuthPayload | null | undefined): unknown {
  if (!payload || typeof payload !== 'object' || !payload.success) {
    return null;
  }

  // /login은 success만 응답할 수 있고, /auth/me는 현재 세션 사용자 data를 제공한다.
  // 로그인 직후 재조회 전의 호환 값이며 업무 권한(staffRole)은 추정하지 않는다.
  return payload.user ?? payload.data ?? { authenticated: true };
}
