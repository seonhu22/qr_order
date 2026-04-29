import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCurrentAdminMenu } from '@/shared/menu/useAdminMenuCatalogQuery';
import { useAdminMenuStore } from '@/apps/admin/stores/adminMenuStore';

export function useSyncCurrentAdminMenu() {
  const location = useLocation();
  const setCurrentMenu = useAdminMenuStore((state) => state.setCurrentMenu);
  const { currentMenu, ...menuCatalogQuery } = useCurrentAdminMenu(location.pathname);

  useEffect(() => {
    setCurrentMenu(currentMenu?.menuCd, location.pathname);
  }, [currentMenu?.menuCd, location.pathname, setCurrentMenu]);

  return {
    ...menuCatalogQuery,
    currentMenu,
  };
}
