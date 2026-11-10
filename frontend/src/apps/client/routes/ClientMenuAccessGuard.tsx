import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserStaffRole } from '@/shared/auth/authUserDisplay';
import { canManageClientMenus } from '@/shared/menu/clientMenuAccess';

export function ClientMenuAccessGuard() {
  const { user } = useAuth();
  // Membership in the protected route group is authoritative, not raw URL text.
  return canManageClientMenus(getAuthUserStaffRole(user))
    ? <Outlet />
    : <Navigate to="/client/main" replace />;
}
