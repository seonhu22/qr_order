import { Navigate, useLocation, useRoutes } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import LoginPage from '@/apps/admin/pages/login/LoginPage';
import { AdminForbiddenPage } from '@/apps/admin/pages/forbidden/AdminForbiddenPage';
import { AppLoadingScreen } from '@/shared/components/loading';

import { adminRoutes } from '@/apps/admin/routes/AdminRoutes';
import { clientRoutes } from '@/apps/client/routes/ClientRoutes';
import { consumerRoutes } from '@/apps/consumer/routes/ConsumerRoutes';
import { devRoutes } from '@/shared/dev/DevRoutes';
import { isInitialPasswordChangeRequired } from '@/shared/auth/initPassword';
import { isLoginPath, resolveLoginPath } from '@/shared/auth/authRedirect';

/**
 * 인증이 필요한 관리자 라우트를 보호한다.
 *
 * @param {{ children: React.ReactNode }} props 보호 대상 라우트 요소
 * @param {React.ReactNode} props.children 인증 성공 시 렌더링할 요소
 * @returns {React.ReactNode}
 */
type RequireAuthProps = {
  children: ReactNode;
};

function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const loginPath = resolveLoginPath(location.pathname);

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  if (isInitialPasswordChangeRequired(user)) {
    return <Navigate to={loginPath} replace />;
  }

  return children;
}

/**
 * 인증이 필요한 관리자 라우트 배열에 RequireAuth를 적용한다.
 *
 * @param {Array<{ path: string, element: React.ReactNode, children?: unknown[] }>} routes 보호 대상 라우트 목록
 * @returns {Array<{ path: string, element: React.ReactNode, children?: unknown[] }>}
 */
function withProtectedElement(routes: RouteObject[]): RouteObject[] {
  return routes.map((route) => ({
    ...route,
    element: <RequireAuth>{route.element}</RequireAuth>,
  }));
}

function LoadingScreen() {
  return <AppLoadingScreen message="로딩 중..." />;
}

/** 인증 확인이 너무 빨리 끝나면 로딩 화면이 순간 깜빡이기만 하고 사라져 눈에 안 보인다 —
    한 번 뜨면 최소 이 시간(ms) 동안은 유지한다. (방지를 위해서)*/
const MIN_LOADING_DISPLAY_MS = 600;

function useMinDisplayDuration(active: boolean, minMs: number) {
  const [shouldShow, setShouldShow] = useState(active);
  const [prevActive, setPrevActive] = useState(active);
  const shownAtRef = useRef<number | null>(null);

  // active가 true로 바뀌는 순간은 지연 없이 즉시 반영한다(렌더 중 상태 조정 — ConsumerBottomSheet의
  // prevOpen과 같은 패턴). 시작 시각 기록과 "얼마나 더 유지할지" 계산은 effect에서 담당한다.
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) setShouldShow(true);
  }

  useEffect(() => {
    if (active) {
      shownAtRef.current = Date.now();
      return undefined;
    }

    if (shownAtRef.current === null) return undefined;

    const remaining = Math.max(0, minMs - (Date.now() - shownAtRef.current));
    const timer = setTimeout(() => setShouldShow(false), remaining);
    return () => clearTimeout(timer);
  }, [active, minMs]);

  return shouldShow;
}

function resolveDefaultPath(isAuthenticated: boolean, isPasswordChangeRequired: boolean) {
  return isAuthenticated && !isPasswordChangeRequired ? '/client/main' : '/client/login';
}

function isPublicStandalonePath(pathname: string) {
  return isLoginPath(pathname) || pathname.startsWith('/qr/') || pathname.startsWith('/consumer');
}

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const showLoading = useMinDisplayDuration(isLoading, MIN_LOADING_DISPLAY_MS);
  const location = useLocation();
  const isPasswordChangeRequired = isAuthenticated && isInitialPasswordChangeRequired(user);
  const publicClientRoutes = clientRoutes.filter((route) => route.path === '/client/login');
  const protectedClientRoutes = clientRoutes.filter((route) => route.path !== '/client/login');

  const routes = useRoutes([
    {
      path: '/',
      element: (
        <Navigate to={resolveDefaultPath(isAuthenticated, isPasswordChangeRequired)} replace />
      ),
    },
    {
      path: '/admin/login',
      element:
        isAuthenticated && !isPasswordChangeRequired ? (
          <Navigate to="/admin/main" replace />
        ) : (
          <LoginPage />
        ),
    },
    {
      path: '/admin/forbidden',
      element: (
        <RequireAuth>
          <AdminForbiddenPage />
        </RequireAuth>
      ),
    },
    ...withProtectedElement(adminRoutes),

    /* ── 클라이언트 라우트 ── */
    ...publicClientRoutes,
    ...withProtectedElement(protectedClientRoutes),

    /* ── QR 소비자 진입 라우트 (인증 불필요) ── */
    ...consumerRoutes,

    /* ── 개발 전용 가이드 (인증 불필요) ── */
    ...devRoutes,

    {
      path: '*',
      element: (
        <Navigate to={resolveDefaultPath(isAuthenticated, isPasswordChangeRequired)} replace />
      ),
    },
  ]);

  if (showLoading && !isPublicStandalonePath(location.pathname)) {
    return <LoadingScreen />;
  }

  return routes;
}

export default AppRoutes;
