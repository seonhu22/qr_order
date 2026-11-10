import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserStaffRole } from '@/shared/auth/authUserDisplay';
import { canAccessClientMenuPath } from '@/shared/menu/clientMenuAccess';

export function ClientMenuAccessGuard() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  return canAccessClientMenuPath(pathname, getAuthUserStaffRole(user))
    ? <Outlet />
    : <Navigate to="/client/main" replace />;
}
