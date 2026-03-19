import { Navigate, useRoutes } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';

import { adminRoutes } from '@/apps/admin/routes/AdminRoutes';
import { devRoutes } from '@/shared/dev/DevRoutes';
// TODO : 리펙토링 필요
// 인증이 필요한 라우트를 보호하는 컴포넌트
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// TODO : 리팩토링 필요,
// 인증이 필요한 라우트에 RequireAuth 컴포넌트를 적용하는 헬퍼 함수
function withProtectedElement(routes) {
  return routes.map((route) => ({
    ...route,
    element: <RequireAuth>{route.element}</RequireAuth>,
  }));
}

// TODO : 로딩 스피너 컴포넌트로 교체(Feedback 컴포넌트로 이동)
function LoadingScreen() {
  return <div className="app-loading">로딩 중...</div>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  const routes = useRoutes([
    {
      path: '/',
      // element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />,
    },
    ...withProtectedElement(adminRoutes),

    /* ── 개발 전용 가이드 (인증 불필요) ── */
    ...devRoutes,

    {
      path: '*',
      element: <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />,
    },
  ]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return routes;
}

export default AppRoutes;
