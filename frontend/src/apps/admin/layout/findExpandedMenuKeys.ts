//src/apps/admin/layout/findExpandedMenuKeys.ts
import { ADMIN_SIDEBAR_MENU } from './adminSidebarMenu';
/**
 * 주어진 경로명에 해당하는 확장된 메뉴 키를 찾습니다.
 * @param {string} pathname - 찾을 경로명
 * @returns {ExpandedMenuKeys} depth1Key와 depth2Key를 포함한 객체
 * @example
 * const keys = findExpandedMenuKeys('/admin/users');
 * // returns { depth1Key: 'menu1', depth2Key: 'submenu1' }
 *
 * const notFound = findExpandedMenuKeys('/invalid/path');
 * // returns { depth1Key: null, depth2Key: null }
 */

type ExpandedMenuKeys = {
  depth1Key: string | null;
  depth2Key: string | null;
};

export function findExpandedMenuKeys(pathname: string): ExpandedMenuKeys {
  const matchedDepth1 = ADMIN_SIDEBAR_MENU.find((depth1) =>
    depth1.groups.some((group) => group.items.some((item) => item.path === pathname)),
  );

  if (!matchedDepth1) {
    return {
      depth1Key: null,
      depth2Key: null,
    };
  }

  const matchedDepth2 = matchedDepth1.groups.find((group) =>
    group.items.some((item) => item.path === pathname),
  );

  return {
    depth1Key: matchedDepth1.key,
    depth2Key: matchedDepth2?.key ?? null,
  };
}
