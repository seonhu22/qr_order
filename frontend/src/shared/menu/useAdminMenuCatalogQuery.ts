import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGetMenu } from '@/generated/settings-controller/settings-controller';
import { queryKeys } from '@/shared/api/queryKeys';
import { createMenuCatalog, findMenuByPath, type MenuCatalogItem } from './menuCatalog';

/**
 * 관리자 메뉴 카탈로그를 가져오는 커스텀 훅
 *
 * - useGetMenu 쿼리를 사용하여 메뉴 데이터를 가져오고, 이를 MenuCatalog 형태로 가공하여 반환
 * - 메뉴 데이터가 변경될 때마다 카탈로그를 재생성하여 최신 상태를 유지
 * - 반환되는 객체에는 원본 쿼리 결과와 함께 가공된 카탈로그와 카탈로그 항목 배열이 포함
 * - 카탈로그 항목 배열은 메뉴 목록에서 각 항목을 쉽게 조회할 수 있도록 제공
 * - 이 훅을 사용하여 관리자 사이드바 메뉴를 구성하거나 현재 경로에 맞는 메뉴 항목을 찾는 데 활용할 수 있음
 *
 * @returns {Object} - 메뉴 카탈로그 쿼리 결과와 가공된 카탈로그 및 카탈로그 항목 배열을 포함하는 객체
 */
export function useAdminMenuCatalogQuery() {
  const menuQuery = useGetMenu({
    query: {
      queryKey: queryKeys.menu.list(),
    },
  });

  const catalog = useMemo(() => createMenuCatalog(menuQuery.data ?? []), [menuQuery.data]);

  return {
    ...menuQuery,
    catalog,
    catalogItems: catalog.items,
  };
}

/**
 * 현재 경로에 가장 잘 맞는 메뉴 항목을 찾아 반환하는 함수
 */
export function getCurrentAdminMenu(
  pathname: string,
  catalogItems: MenuCatalogItem[],
): MenuCatalogItem | undefined {
  return findMenuByPath(
    {
      items: catalogItems,
      byMenuCd: new Map(catalogItems.map((item) => [item.menuCd, item])),
      byPath: new Map(catalogItems.filter((item) => item.path).map((item) => [item.path, item])),
    },
    pathname,
  );
}

/**
 * 관리자 메뉴 카탈로그를 가져오고 현재 경로에 맞는 메뉴 항목을 반환하는 커스텀 훅
 *
 * - useLocation을 사용하여 현재 경로를 가져오고, useAdminMenuCatalogQuery를 사용하여 메뉴 카탈로그를 가져옴
 * - 현재 경로에 가장 잘 맞는 메뉴 항목을 찾아 반환
 * - 메뉴 카탈로그나 현재 경로가 변경될 때마다 현재 메뉴를 재계산하여 최신 상태를 유지
 * - 이 훅을 사용하여 관리자 사이드바에서 현재 활성화된 메뉴 항목을 쉽게 조회할 수 있음
 *
 * @returns {Object} - 메뉴 카탈로그 쿼리 결과와 현재 경로에 맞는 메뉴 항목을 포함하는 객체
 */
export function useCurrentAdminMenu(pathname?: string) {
  // useLocation을 사용하여 현재 경로를 가져옵니다. pathname이 인자로 주어지면 해당 값을 사용하고, 그렇지 않으면 location.pathname을 사용합니다.
  const location = useLocation();
  const menuCatalogQuery = useAdminMenuCatalogQuery();
  const resolvedPathname = pathname ?? location.pathname;

  // 현재 경로에 가장 잘 맞는 메뉴 항목을 찾아 반환합니다. menuCatalogQuery.catalogItems가 변경될 때마다 현재 메뉴를 재계산합니다.
  const currentMenu = useMemo(
    () => getCurrentAdminMenu(resolvedPathname, menuCatalogQuery.catalogItems),
    [menuCatalogQuery.catalogItems, resolvedPathname],
  );

  return {
    ...menuCatalogQuery,
    currentMenu,
  };
}
