//src/apps/admin/features/sidebar/utils/findExpandedMenuKeys.ts
import type { SidebarNavDepth1 } from '@/shared/components/sidebar/types';
import { findSidebarNavigationByPath } from './adminMenuCatalogNav';

type ExpandedMenuKeys = {
  depth1Key: string | null;
  depth2Key: string | null;
};

export function findExpandedMenuKeys(
  pathname: string,
  menus: readonly SidebarNavDepth1[],
): ExpandedMenuKeys {
  const navigation = findSidebarNavigationByPath(pathname, menus);

  if (!navigation) return { depth1Key: null, depth2Key: null };

  return {
    depth1Key: navigation.depth1Key,
    depth2Key: navigation.depth2Key,
  };
}
