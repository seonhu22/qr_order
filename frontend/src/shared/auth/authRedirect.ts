/**
 * @fileoverview 인증 만료 이벤트 유틸.
 *
 * httpClient처럼 React 훅을 사용할 수 없는 계층은 이벤트만 발행하고,
 * modal/signOut/navigate 처리는 AuthRedirectHandler가 담당한다.
 */
import { isAuthTransitioning } from '@/shared/auth/authTransition';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

export type AuthUnauthorizedEventDetail = {
  message?: string;
};

export type AuthUnauthorizedEvent = CustomEvent<AuthUnauthorizedEventDetail>;

export function resolveLoginPath(pathname: string): string {
  if (pathname.startsWith('/admin')) {
    return '/admin/login';
  }

  return '/admin/login';
}

export function isLoginPath(pathname: string): boolean {
  return pathname === '/admin/login';
}

export function notifyUnauthorized(detail: AuthUnauthorizedEventDetail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (isAuthTransitioning()) {
    return;
  }

  window.dispatchEvent(new CustomEvent<AuthUnauthorizedEventDetail>(AUTH_UNAUTHORIZED_EVENT, { detail }));
}

export function subscribeUnauthorized(handler: (event: AuthUnauthorizedEvent) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler as EventListener);
  };
}
