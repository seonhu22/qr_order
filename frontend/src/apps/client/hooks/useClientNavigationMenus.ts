import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { createClientNavigationData } from '@/shared/menu/clientNavigation';
import { useAdminMenuCatalogQuery } from '@/shared/menu/useAdminMenuCatalogQuery';

export function useClientNavigationMenus() {
  const location = useLocation();
  const menuCatalogQuery = useAdminMenuCatalogQuery();

  const navigation = useMemo(
    () => createClientNavigationData(menuCatalogQuery.catalogItems, location.pathname),
    [location.pathname, menuCatalogQuery.catalogItems],
  );

  return {
    ...menuCatalogQuery,
    ...navigation,
  };
}
