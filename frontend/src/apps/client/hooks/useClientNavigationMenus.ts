import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { createClientNavigationData } from '@/shared/menu/clientNavigation';
import { useAdminMenuCatalogQuery } from '@/shared/menu/useAdminMenuCatalogQuery';
import { useAuth } from '@/shared/auth/AuthContext';
import { getAuthUserStaffRole } from '@/shared/auth/authUserDisplay';

export function useClientNavigationMenus() {
  const location = useLocation();
  const menuCatalogQuery = useAdminMenuCatalogQuery();
  const { user } = useAuth();
  const staffRole = getAuthUserStaffRole(user);

  const navigation = useMemo(
    () => createClientNavigationData(menuCatalogQuery.catalogItems, location.pathname, staffRole),
    [location.pathname, menuCatalogQuery.catalogItems, staffRole],
  );

  return {
    ...menuCatalogQuery,
    ...navigation,
  };
}
