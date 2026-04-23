//src/apps/admin/features/sidebar/utils/findExpandedMenuKeys.ts
import type { SidebarNavDepth1 } from '@/shared/components/sidebar/types';
import { SYSTEM_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/systemSidebarMenu';
import { BOARD_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/boardSidebarMenu';
import type { AdminSection } from '@/apps/admin/stores/adminLayoutStore';

type ExpandedMenuKeys = {
  depth1Key: string | null;
  depth2Key: string | null;
};

export function findExpandedMenuKeys(
  pathname: string,
  menus: readonly SidebarNavDepth1[] = SYSTEM_SIDEBAR_MENU,
): ExpandedMenuKeys {
  const matchedDepth1 = menus.find((depth1) =>
    depth1.groups.some((group) => group.items.some((item) => item.path === pathname)),
  );

  if (!matchedDepth1) return { depth1Key: null, depth2Key: null };

  const matchedDepth2 = matchedDepth1.groups.find((group) =>
    group.items.some((item) => item.path === pathname),
  );

  return {
    depth1Key: matchedDepth1.key,
    depth2Key: matchedDepth2?.key ?? null,
  };
}

/** pathname이 속한 섹션을 반환한다. 어느 메뉴에도 없으면 null. */
export function detectSectionFromPath(pathname: string): AdminSection | null {
  const inSystem = SYSTEM_SIDEBAR_MENU.some((d1) =>
    d1.groups.some((g) => g.items.some((item) => item.path === pathname)),
  );
  if (inSystem) return 'system';

  const inBoard = BOARD_SIDEBAR_MENU.some((d1) =>
    d1.groups.some((g) => g.items.some((item) => item.path === pathname)),
  );
  if (inBoard) return 'board';

  return null;
}
