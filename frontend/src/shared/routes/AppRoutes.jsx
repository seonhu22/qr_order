import { Navigate, useRoutes } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import LoginPage from '@/apps/admin/pages/LoginPage';

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
  // 보호 라우트는 아직 실제 인증 정책 확정 전이라, 상태값은 후속 구현 시 다시 사용한다.
  const { isAuthenticated: _isAuthenticated } = useAuth();

  // TODO : 로그인 상태 테스트를 위해 잠시 가렸다.
  // if (!isAuthenticated) {
  //   return <Navigate to="/admin/login" replace />;
  // }

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
  const { isAuthenticated, isLoading } = useAuth();

  const routes = useRoutes([
    {
      path: '/',
      element: <Navigate to={isAuthenticated ? '/admin/main' : '/admin/login'} replace />,
    },
    {
      path: '/admin/login',
      element: isAuthenticated ? <Navigate to="/admin/main" replace /> : <LoginPage />,
    },
    ...withProtectedElement(adminRoutes),

    /* ── 개발 전용 가이드 (인증 불필요) ── */
    ...devRoutes,

    {
      path: '*',
      element: <Navigate to={isAuthenticated ? '/admin/main' : '/admin/login'} replace />,
    },
  ]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return routes;
}

export default AppRoutes;
