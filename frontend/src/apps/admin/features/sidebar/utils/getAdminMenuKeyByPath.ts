import { BOARD_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/boardSidebarMenu';
import { SYSTEM_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/systemSidebarMenu';

type AdminMenuConfig = readonly {
  groups: readonly {
    items: readonly {
      key: string;
      path: string;
    }[];
  }[];
}[];

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }

  return path;
}

function flattenMenuItems(menus: AdminMenuConfig) {
  return menus.flatMap((depth1) =>
    depth1.groups.flatMap((group) =>
      group.items.map((item) => ({
        key: item.key,
        path: normalizePath(item.path),
      })),
    ),
  );
}

const ADMIN_MENU_ITEMS = flattenMenuItems([...SYSTEM_SIDEBAR_MENU, ...BOARD_SIDEBAR_MENU]);

export function getAdminMenuKeyByPath(pathname: string) {
  const normalizedPathname = normalizePath(pathname);
  const exactMatch = ADMIN_MENU_ITEMS.find((item) => item.path === normalizedPathname);

  if (exactMatch) {
    return exactMatch.key;
  }

  return ADMIN_MENU_ITEMS
    .filter((item) => normalizedPathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.key;
}
