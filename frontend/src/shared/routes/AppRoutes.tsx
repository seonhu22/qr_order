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

/**
 * active가 꺼질 때(로딩 종료) 결국 보호된 콘텐츠로 이어지는 경우에만 최소 노출 시간을 지킨다.
 * 비로그인으로 끝나 로그인 페이지로 튕겨나갈 때(enforceOnHide=false)까지 억지로 붙잡아두면
 * "로딩 화면 → 로그인 화면"이 두 번 깜빡이는 것처럼 보여서, 그 경우엔 즉시 사라지게 한다.
 */
function useMinDisplayDuration(active: boolean, minMs: number, enforceOnHide: boolean) {
  const [shouldShow, setShouldShow] = useState(active);
  const [prevActive, setPrevActive] = useState(active);
  const shownAtRef = useRef<number | null>(null);

  // active가 바뀌는 순간의 "즉시" 반영(켜짐, 또는 최소 노출을 안 지킬 때의 꺼짐)은 지연 없이
  // 렌더 중 상태 조정으로 처리한다(ConsumerBottomSheet의 prevOpen과 같은 패턴). "얼마나 더
  // 유지할지" 계산과 지연된 꺼짐만 effect에서 담당한다.
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) {
      setShouldShow(true);
    } else if (!enforceOnHide) {
      setShouldShow(false);
    }
  }

  useEffect(() => {
    if (active) {
      shownAtRef.current = Date.now();
      return undefined;
    }

    if (!enforceOnHide || shownAtRef.current === null) return undefined;

    const remaining = Math.max(0, minMs - (Date.now() - shownAtRef.current));
    const timer = setTimeout(() => setShouldShow(false), remaining);
    return () => clearTimeout(timer);
  }, [active, minMs, enforceOnHide]);

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
  const isPasswordChangeRequired = isAuthenticated && isInitialPasswordChangeRequired(user);
  // 로딩이 끝난 뒤 보호된 콘텐츠로 이어지는 경우(로그인 완료 + 초기 비밀번호 변경도 불필요)에만
  // 최소 노출 시간을 지킨다 — 그 외(로그인 페이지로 튕겨나갈 것)는 즉시 사라지게 한다.
  const showLoading = useMinDisplayDuration(
    isLoading,
    MIN_LOADING_DISPLAY_MS,
    isAuthenticated && !isPasswordChangeRequired,
  );
  const location = useLocation();
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
