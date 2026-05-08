/**
 * @fileoverview 인증 상태 전환 흐름을 추적한다.
 *
 * 로그인, 로그아웃, 비밀번호 변경처럼 인증 상태가 바뀌는 동안 발생한 401은
 * 일반 세션 만료 UX로 처리하지 않기 위해 사용한다.
 */

let authTransitionCount = 0;

export function beginAuthTransition() {
  authTransitionCount += 1;
}

export function endAuthTransition() {
  authTransitionCount = Math.max(0, authTransitionCount - 1);
}

export function isAuthTransitioning() {
  return authTransitionCount > 0;
}
