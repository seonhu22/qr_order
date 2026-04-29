import type { SidebarNavDepth1 } from '@/shared/components/sidebar/types';
import type { MenuCatalog, MenuCatalogItem } from '@/shared/menu/menuCatalog';
import { findBestPathMatch, normalizeMenuPath } from '@/shared/menu/menuCatalog';

export function applyMenuCatalogToSidebarMenus(
  menus: readonly SidebarNavDepth1[],
  catalog: MenuCatalog,
): SidebarNavDepth1[] {
  return menus.map((depth1) => ({
    ...depth1,
    groups: depth1.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        const catalogItem =
          catalog.byPath.get(normalizeMenuPath(item.path)) ?? catalog.byMenuCd.get(item.key);

        if (!catalogItem) {
          return item;
        }

        return {
          ...item,
          label: catalogItem.menuNm || item.label,
          path: catalogItem.path || item.path,
        };
      }),
    })),
  }));
}

function flattenSidebarItems(menus: readonly SidebarNavDepth1[]) {
  return menus.flatMap((depth1) =>
    depth1.groups.flatMap((group) =>
      group.items.map((item) => ({
        depth1Key: depth1.key,
        depth1Label: depth1.label,
        depth2Key: group.key,
        depth2Label: group.label,
        itemKey: item.key,
        itemLabel: item.label,
        path: item.path,
      })),
    ),
  );
}

export function findSidebarNavigationByPath(
  pathname: string,
  menus: readonly SidebarNavDepth1[],
) {
  const matched = findBestPathMatch(flattenSidebarItems(menus), pathname);

  if (!matched) {
    return undefined;
  }

  return {
    depth1Key: matched.depth1Key,
    depth1Label: matched.depth1Label,
    depth2Key: matched.depth2Key,
    depth2Label: matched.depth2Label,
    itemKey: matched.itemKey,
    itemLabel: matched.itemLabel,
    path: matched.path,
  };
}

export function detectSectionFromMenus(
  pathname: string,
  systemMenus: readonly SidebarNavDepth1[],
  boardMenus: readonly SidebarNavDepth1[],
) {
  if (findSidebarNavigationByPath(pathname, systemMenus)) {
    return 'system' as const;
  }

  if (findSidebarNavigationByPath(pathname, boardMenus)) {
    return 'board' as const;
  }

  return null;
}

export function findCatalogMenuByStaticRoute(
  catalog: MenuCatalog,
  routePath: string,
  fallbackMenuCd?: string,
) {
  return (
    catalog.byPath.get(normalizeMenuPath(routePath)) ??
    (fallbackMenuCd ? catalog.byMenuCd.get(fallbackMenuCd) : undefined)
  );
}

export function findMenuByIdentity(
  items: MenuCatalogItem[],
  identity?: { sysId?: string; menuCd?: string; path?: string },
) {
  if (!identity) {
    return undefined;
  }

  if (identity.sysId) {
    const bySysId = items.find((item) => item.sysId === identity.sysId);
    if (bySysId) {
      return bySysId;
    }
  }

  if (identity.path) {
    const byPath = items.find((item) => item.path === normalizeMenuPath(identity.path));
    if (byPath) {
      return byPath;
    }
  }

  if (identity.menuCd) {
    return items.find((item) => item.menuCd === identity.menuCd);
  }

  return undefined;
}
