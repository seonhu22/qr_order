import { Navigate, useRoutes } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import LoginPage from '@/apps/admin/pages/login/LoginPage';

import { adminRoutes } from '@/apps/admin/routes/AdminRoutes';
import { devRoutes } from '@/shared/dev/DevRoutes';

/**
 * 인증이 필요한 관리자 라우트를 보호한다.
 *
 * @param {{ children: React.ReactNode }} props 보호 대상 라우트 요소
 * @param {React.ReactNode} props.children 인증 성공 시 렌더링할 요소
 * @returns {React.ReactNode}
 */
function RequireAuth({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (typeof user?.init_yn === 'string' && user.init_yn.toLowerCase() === 'y') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

/**
 * 인증이 필요한 관리자 라우트 배열에 RequireAuth를 적용한다.
 *
 * @param {Array<{ path: string, element: React.ReactNode, children?: unknown[] }>} routes 보호 대상 라우트 목록
 * @returns {Array<{ path: string, element: React.ReactNode, children?: unknown[] }>}
 */
function withProtectedElement(routes) {
  return routes.map((route) => ({
    ...route,
    element: <RequireAuth>{route.element}</RequireAuth>,
  }));
}

function LoadingScreen() {
  return <div className="app-loading">로딩 중...</div>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const needsPasswordChange =
    isAuthenticated && typeof user?.init_yn === 'string' && user.init_yn.toLowerCase() === 'y';

  const routes = useRoutes([
    {
      path: '/',
      element: <Navigate to={isAuthenticated && !needsPasswordChange ? '/admin/main' : '/admin/login'} replace />,
    },
    {
      path: '/admin/login',
      element: isAuthenticated && !needsPasswordChange ? <Navigate to="/admin/main" replace /> : <LoginPage />,
    },
    ...withProtectedElement(adminRoutes),

    /* ── 개발 전용 가이드 (인증 불필요) ── */
    ...devRoutes,

    {
      path: '*',
      element: <Navigate to={isAuthenticated && !needsPasswordChange ? '/admin/main' : '/admin/login'} replace />,
    },
  ]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return routes;
}

export default AppRoutes;
