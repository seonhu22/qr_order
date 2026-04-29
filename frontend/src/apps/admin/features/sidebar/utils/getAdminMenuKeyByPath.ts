import { BOARD_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/boardSidebarMenu';
import { SYSTEM_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/systemSidebarMenu';
import { findBestPathMatch, normalizeMenuPath } from '@/shared/menu/menuCatalog';

type AdminMenuConfig = readonly {
  groups: readonly {
    items: readonly {
      key: string;
      path: string;
    }[];
  }[];
}[];

// 관리자 사이드바 메뉴 항목들을 평탄화하여 경로와 키를 매핑하는 유틸 함수
function flattenMenuItems(menus: AdminMenuConfig) {
  return menus.flatMap((depth1) =>
    depth1.groups.flatMap((group) =>
      group.items.map((item) => ({
        key: item.key,
        path: normalizeMenuPath(item.path),
      })),
    ),
  );
}

const ADMIN_MENU_ITEMS = flattenMenuItems([...SYSTEM_SIDEBAR_MENU, ...BOARD_SIDEBAR_MENU]);

export function getAdminMenuKeyByPath(pathname: string) {
  return findBestPathMatch(ADMIN_MENU_ITEMS, pathname)?.key;
}
