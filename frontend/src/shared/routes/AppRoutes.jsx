import { Navigate, useRoutes } from 'react-router-dom';
import LoginPage from '@/apps/admin/pages/LoginPage';
import { adminRoutes } from '@/apps/admin/routes/AdminRoutes';
import { useAuth } from '@/shared/auth/AuthContext';
import { devRoutes } from '@/shared/dev/DevRoutes';
import InputGuide from '@/shared/dev/InputGuide';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

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
      element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />,
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
