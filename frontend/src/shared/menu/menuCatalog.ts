import type { Menu } from '@/generated/types/menu';

export type MenuCatalogItem = {
  sysId?: string;
  menuCd: string;
  menuNm: string;
  parentMenuCd: string;
  path: string;
  ordNo: number;
  treeLevel: number;
};

export type MenuCatalog = {
  items: MenuCatalogItem[];
  byMenuCd: Map<string, MenuCatalogItem>;
  byPath: Map<string, MenuCatalogItem>;
};

/**
 * 경로를 정규화하여 일관된 형태로 만들어주는 함수
 * - null 또는 undefined는 빈 문자열로 변환
 * - 양 끝의 공백 제거
 * - 루트 경로('/')를 제외한 경로에서 끝에 '/' 제거
 */
export function normalizeMenuPath(path?: string | null) {
  const trimmedPath = path?.trim() ?? '';

  if (!trimmedPath) {
    return '';
  }

  if (trimmedPath.length > 1 && trimmedPath.endsWith('/')) {
    return trimmedPath.slice(0, -1);
  }

  return trimmedPath;
}

/**
 * Menu 객체를 MenuCatalogItem으로 변환하는 함수
 * - Menu의 필드들을 MenuCatalogItem의 필드에 매핑
 * - 경로는 normalizeMenuPath 함수를 통해 정규화
 * - ordNo와 treeLevel은 숫자로 변환하며, 변환이 실패할 경우 0으로 처리
 * - sysId는 선택적으로 포함 (존재하지 않을 경우 undefined)
 * - menuCd, menuNm, parentMenuCd는 Menu 객체에서 그대로 매핑
 * - 반환된 MenuCatalogItem은 MenuCatalog의 항목으로 사용될 수 있음
 *
 * @param menu - 변환할 Menu 객체
 * @returns MenuCatalogItem으로 변환된 객체
 */
export function mapMenuToCatalogItem(menu: Menu): MenuCatalogItem {
  return {
    sysId: menu.sysId,
    menuCd: menu.menuCd,
    menuNm: menu.menuNm,
    parentMenuCd: menu.parentMenuCd,
    path: normalizeMenuPath(menu.menuUrl),
    ordNo: Number(menu.ordNo) || 0,
    treeLevel: Number(menu.treeLevel) || 0,
  };
}

/**
 * 주어진 Menu 배열을 기반으로 MenuCatalog를 생성하는 함수
 * - 각 Menu 객체를 MenuCatalogItem으로 변환하여 items 배열 생성
 * - byMenuCd 맵은 menuCd를 키로, MenuCatalogItem을 값으로 매핑
 * - byPath 맵은 path가 존재하는 항목에 대해 path를 키로, MenuCatalogItem을 값으로 매핑
 * - 반환된 MenuCatalog는 메뉴 항목들을 효율적으로 조회할 수 있는 구조를 제공
 * @param menus - Menu 객체들의 배열
 * @returns MenuCatalog 객체
 * @example
 * const menus = [
 *   { sysId: '1', menuCd: 'home', menuNm: 'Home', parentMenuCd: '', menuUrl: '/home', ordNo: '1', treeLevel: '1' },
 *   { sysId: '2', menuCd: 'profile', menuNm: 'Profile', parentMenuCd: 'home', menuUrl: '/home/profile', ordNo: '1', treeLevel: '2' },
 * ];
 */
export function createMenuCatalog(menus: Menu[]): MenuCatalog {
  const items = menus.map(mapMenuToCatalogItem);

  return {
    items,
    byMenuCd: new Map(items.map((item) => [item.menuCd, item])),
    byPath: new Map(items.filter((item) => item.path).map((item) => [item.path, item])),
  };
}

/**
 * 주어진 경로명과 가장 잘 맞는 항목을 찾아 반환합니다.
 *
 * @template T - `path` 속성을 가진 객체 타입
 * @param items - 검색할 항목들의 배열 (읽기 전용)
 * @param pathname - 매칭할 경로명 (선택사항)
 * @returns 정확히 일치하거나 가장 긴 경로로 시작하는 항목을 반환하며,
 *          일치하는 항목이 없으면 undefined를 반환합니다.
 *
 * @example
 * // 정확한 경로 매칭
 * const menu = [{ path: '/home' }, { path: '/home/profile' }];
 * findBestPathMatch(menu, '/home'); // { path: '/home' } 반환
 *
 * @example
 * // 부분 경로 매칭 (가장 긴 경로 우선)
 * const menu = [{ path: '/home' }, { path: '/home/profile' }];
 * findBestPathMatch(menu, '/home/profile/edit'); // { path: '/home/profile' } 반환
 */
export function findBestPathMatch<T extends { path: string }>(
  items: readonly T[],
  pathname?: string | null,
) {
  const normalizedPathname = normalizeMenuPath(pathname);

  if (!normalizedPathname) {
    return undefined;
  }

  const exactMatch = items.find((item) => item.path === normalizedPathname);

  if (exactMatch) {
    return exactMatch;
  }

  return items
    .filter((item) => item.path && normalizedPathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

/**
 * 메뉴 코드로 메뉴 항목을 조회하는 유틸 함수
 * - catalog에서 menuCd로 메뉴 항목을 조회하여 반환
 * - menuCd가 null 또는 undefined인 경우 undefined 반환
 * - 일치하는 메뉴 항목이 없는 경우 undefined 반환
 * @param catalog - 메뉴 카탈로그 객체
 * @param menuCd - 조회할 메뉴 코드 (선택사항)
 * @returns menuCd에 해당하는 MenuCatalogItem 또는 undefined
 * @example
 * const catalog = createMenuCatalog([
 *   { sysId: '1', menuCd: 'home', menuNm: 'Home', parentMenuCd: '', menuUrl: '/home', ordNo: '1', treeLevel: '1' },
 *   { sysId: '2', menuCd: 'profile', menuNm: 'Profile', parentMenuCd: 'home', menuUrl: '/home/profile', ordNo: '1', treeLevel: '2' },
 * ]);
 * findMenuByCd(catalog, 'profile'); // { sysId: '2', menuCd: 'profile', ... } 반환
 * findMenuByCd(catalog, 'nonexistent'); // undefined 반환
 * findMenuByCd(catalog, null); // undefined 반환
 * findMenuByCd(catalog, undefined); // undefined 반환
 */
export function findMenuByCd(catalog: MenuCatalog, menuCd?: string | null) {
  if (!menuCd) {
    return undefined;
  }

  return catalog.byMenuCd.get(menuCd);
}

/**
 * 경로명으로 메뉴 항목을 조회하는 유틸 함수
 * - 먼저 경로명과 정확히 일치하는 항목을 조회
 * - 일치하는 항목이 없는 경우, findBestPathMatch 함수를 사용하여 가장 잘 맞는 항목을 조회
 * - pathname이 null 또는 undefined인 경우 undefined 반환
 * @param catalog - 메뉴 카탈로그 객체
 * @param pathname - 조회할 경로명 (선택사항)
 * @returns pathname에 해당하는 MenuCatalogItem 또는 undefined
 * @example
 * const catalog = createMenuCatalog([
 *   { sysId: '1', menuCd: 'home', menuNm: 'Home', parentMenuCd: '', menuUrl: '/home', ordNo: '1', treeLevel: '1' },
 *   { sysId: '2', menuCd: 'profile', menuNm: 'Profile', parentMenuCd: 'home', menuUrl: '/home/profile', ordNo: '1', treeLevel: '2' },
 * ]);
 * findMenuByPath(catalog, '/home'); // { sysId: '1', menuCd: 'home', ... } 반환 (정확한 매칭)
 * findMenuByPath(catalog, '/home/profile/edit'); // { sysId: '2', menuCd: 'profile', ... } 반환 (부분 매칭)
 * findMenuByPath(catalog, '/nonexistent'); // undefined 반환
 * findMenuByPath(catalog, null); // undefined 반환
 * findMenuByPath(catalog, undefined); // undefined 반환
 */
export function findMenuByPath(catalog: MenuCatalog, pathname?: string | null) {
  const exactPathMatch = normalizeMenuPath(pathname);

  if (exactPathMatch) {
    const byPath = catalog.byPath.get(exactPathMatch);
    if (byPath) {
      return byPath;
    }
  }

  return findBestPathMatch(catalog.items, pathname);
}

/**
 * 메뉴 코드로 메뉴명을 조회하는 유틸 함수
 * - catalog에서 menuCd로 메뉴 항목을 조회하여 menuNm 반환
 * - menuCd가 null 또는 undefined인 경우 undefined 반환
 * - 일치하는 메뉴 항목이 없는 경우 undefined 반환
 * @param catalog - 메뉴 카탈로그 객체
 * @param menuCd - 조회할 메뉴 코드 (선택사항)
 * @returns menuCd에 해당하는 메뉴명 또는 undefined
 * @example
 * const catalog = createMenuCatalog([
 *   { sysId: '1', menuCd: 'home', menuNm: 'Home', parentMenuCd: '', menuUrl: '/home', ordNo: '1', treeLevel: '1' },
 *   { sysId: '2', menuCd: 'profile', menuNm: 'Profile', parentMenuCd: 'home', menuUrl: '/home/profile', ordNo: '1', treeLevel: '2' },
 * ]);
 * getMenuNmByCd(catalog, 'profile'); // 'Profile' 반환
 * getMenuNmByCd(catalog, 'nonexistent'); // undefined 반환
 * getMenuNmByCd(catalog, null); // undefined 반환
 * getMenuNmByCd(catalog, undefined); // undefined 반환
 */
export function getMenuNmByCd(catalog: MenuCatalog, menuCd?: string | null) {
  return findMenuByCd(catalog, menuCd)?.menuNm;
}

export function resolveMenuDisplayName(
  catalog: MenuCatalog,
  menuCd?: string | null,
  menuNm?: string | null,
) {
  const normalizedMenuName = menuNm?.trim() ?? '';
  if (normalizedMenuName) {
    return normalizedMenuName;
  }

  const catalogMenuName = getMenuNmByCd(catalog, menuCd);
  if (catalogMenuName) {
    return catalogMenuName;
  }

  return menuCd?.trim() ?? '';
}
