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
  success: boolean;
  user?: unknown;
  data?: unknown;
}

export function resolveAuthUser(payload: AuthPayload | null | undefined): unknown {
  if (!payload || typeof payload !== 'object' || !payload.success) {
    return null;
  }

  return payload.user ?? payload.data ?? null;
}
