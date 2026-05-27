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

  // TODO: 백엔드 /api/auth/me 응답이 실제 사용자 객체를 data로 내려주도록 수정되면
  // success만으로 인증 상태를 판단하는 임시 처리를 제거한다.
  return payload.user ?? payload.data ?? { authenticated: true };
}
