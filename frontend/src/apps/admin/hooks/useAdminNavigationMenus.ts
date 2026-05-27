import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { createAdminNavigationData } from '@/shared/menu/adminNavigation';
import { useAdminMenuCatalogQuery } from '@/shared/menu/useAdminMenuCatalogQuery';

export function useAdminNavigationMenus() {
  const location = useLocation();
  const menuCatalogQuery = useAdminMenuCatalogQuery();

  const navigation = useMemo(
    () => createAdminNavigationData(menuCatalogQuery.catalogItems, location.pathname),
    [location.pathname, menuCatalogQuery.catalogItems],
  );

  return {
    ...menuCatalogQuery,
    ...navigation,
  };
}
