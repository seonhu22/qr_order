// 클라이언트 메뉴 데이터 — 실제 화면 구현 전에도 라우트와 URL 규칙은 이 파일을 기준으로 맞춘다.
import type { SidebarNavDepth1 } from '@/shared/components/sidebar/types';
import { createAdminNavigationData } from '@/shared/menu/adminNavigation';
import type { MenuCatalogItem } from '@/shared/menu/menuCatalog';

export type ClientSection = string;

export type ClientMenuBreadcrumb = {
  depth1: string;
  depth2: string;
  depth3: string;
};

export type ClientNavigationData = {
  headerSections: { key: ClientSection; label: string }[];
  menusBySection: Record<string, SidebarNavDepth1[]>;
  currentSection: ClientSection | null;
  currentMenus: SidebarNavDepth1[];
  currentMenuCd: string | undefined;
  breadcrumb: ClientMenuBreadcrumb | null;
};

export const CLIENT_ROOT_MENU_CD = 'CLIENT';

export const CLIENT_SECTIONS: { key: ClientSection; label: string }[] = [
  { key: 'STO', label: '매장' },
  { key: 'MNU', label: '메뉴' },
  { key: 'ORD', label: '주문' },
  { key: 'PAY', label: '결제' },
  { key: 'CBRD', label: '게시판' },
];

export const CLIENT_MENUS_BY_SECTION: Record<ClientSection, SidebarNavDepth1[]> = {
  STO: [
    {
      key: 'STO',
      label: '매장',
      groups: [
        {
          key: 'STO_USR',
          label: '유저 관리',
          items: [
            { key: 'STO_USR_MNG', label: '유저 정보 관리', path: '/client/store/user/management' },
          ],
        },
        {
          key: 'STO_INFO',
          label: '매장 정보 관리',
          items: [{ key: 'STO_INFO_BASE', label: '매장 기본 정보', path: '/client/store/info/base' }],
        },
        {
          key: 'STO_TBL',
          label: '테이블 정보 관리',
          items: [
            { key: 'STO_TBL_MNG', label: '테이블 관리', path: '/client/store/table/management' },
            { key: 'STO_TBL_QR', label: 'QR 코드 관리', path: '/client/store/table/qr' },
            { key: 'STO_TBL_LAY', label: '테이블 배치 관리', path: '/client/store/table/layout' },
          ],
        },
      ],
    },
  ],
  MNU: [
    {
      key: 'MNU',
      label: '메뉴',
      groups: [
        {
          key: 'MNU_INFO',
          label: '메뉴 정보 관리',
          items: [
            { key: 'MNU_INFO_MNG', label: '메뉴 관리', path: '/client/menu/info/management' },
            { key: 'MNU_INFO_OPT', label: '옵션 관리', path: '/client/menu/info/option' },
          ],
        },
      ],
    },
  ],
  ORD: [
    {
      key: 'ORD',
      label: '주문',
      groups: [
        {
          key: 'ORD_HIS',
          label: '주문 이력',
          items: [{ key: 'ORD_HIS_LST', label: '주문 이력 조회', path: '/client/order/history/list' }],
        },
        {
          key: 'ORD_STT',
          label: '주문 현황',
          items: [
            { key: 'ORD_STT_MNG', label: '주문 상태 관리', path: '/client/order/status/management' },
          ],
        },
      ],
    },
  ],
  PAY: [
    {
      key: 'PAY',
      label: '결제',
      groups: [
        {
          key: 'PAY_STT',
          label: '결제 현황',
          items: [{ key: 'PAY_STT_LST', label: '결제 목록 조회', path: '/client/payment/status/list' }],
        },
        {
          key: 'PAY_CAL',
          label: '정산 관리',
          items: [
            { key: 'PAY_CAL_LST', label: '정산 조회', path: '/client/payment/calculation/list' },
          ],
        },
      ],
    },
  ],
  CBRD: [
    {
      key: 'CBRD',
      label: '게시판',
      groups: [
        {
          key: 'CBRD_NTC',
          label: '공지사항',
          items: [{ key: 'CBRD_NTC_LST', label: '공지사항 조회', path: '/client/board/notice/list' }],
        },
        {
          key: 'CBRD_QNA',
          label: '문의사항',
          items: [
            { key: 'CBRD_QNA_MNG', label: '문의사항 관리', path: '/client/board/inquiry/management' },
          ],
        },
      ],
    },
  ],
};

export const CLIENT_SIDEBAR_MENUS: SidebarNavDepth1[] =
  Object.values(CLIENT_MENUS_BY_SECTION).flat();

export function findClientSectionByPath(pathname: string): ClientSection | null {
  for (const [section, menus] of Object.entries(CLIENT_MENUS_BY_SECTION)) {
    const hasPath = menus.some((depth1) =>
      depth1.groups.some((group) => group.items.some((item) => item.path === pathname)),
    );

    if (hasPath) {
      return section as ClientSection;
    }
  }

  return null;
}

export function findClientExpandedMenuKeys(
  pathname: string,
  menus: readonly SidebarNavDepth1[] = CLIENT_SIDEBAR_MENUS,
) {
  for (const depth1 of menus) {
    for (const group of depth1.groups) {
      if (group.items.some((item) => item.path === pathname)) {
        return {
          depth1Key: depth1.key,
          depth2Key: group.key,
        };
      }
    }
  }

  return {
    depth1Key: null,
    depth2Key: null,
  };
}

export function findClientMenuBreadcrumb(pathname: string): ClientMenuBreadcrumb | null {
  for (const depth1 of CLIENT_SIDEBAR_MENUS) {
    for (const group of depth1.groups) {
      const item = group.items.find((menuItem) => menuItem.path === pathname);
      if (item) {
        return {
          depth1: depth1.label,
          depth2: group.label,
          depth3: item.label,
        };
      }
    }
  }

  return null;
}

export function findClientMenuCdByPath(pathname: string): string | undefined {
  for (const depth1 of CLIENT_SIDEBAR_MENUS) {
    for (const group of depth1.groups) {
      const item = group.items.find((menuItem) => menuItem.path === pathname);
      if (item) {
        return item.key;
      }
    }
  }

  return undefined;
}

function createFallbackClientNavigationData(pathname: string): ClientNavigationData {
  const currentSection = findClientSectionByPath(pathname);

  return {
    headerSections: CLIENT_SECTIONS,
    menusBySection: CLIENT_MENUS_BY_SECTION,
    currentSection,
    currentMenus: currentSection ? CLIENT_MENUS_BY_SECTION[currentSection] ?? [] : [],
    currentMenuCd: findClientMenuCdByPath(pathname),
    breadcrumb: findClientMenuBreadcrumb(pathname),
  };
}

export function createClientNavigationData(
  items: readonly MenuCatalogItem[],
  pathname: string,
): ClientNavigationData {
  const navigation = createAdminNavigationData(items, pathname, {
    rootMenuCd: CLIENT_ROOT_MENU_CD,
  });

  if (navigation.headerSections.length === 0) {
    return createFallbackClientNavigationData(pathname);
  }

  return {
    headerSections: navigation.headerSections.map(({ section, label }) => ({
      key: section,
      label,
    })),
    menusBySection: navigation.menusBySection,
    currentSection: navigation.currentSection,
    currentMenus: navigation.currentMenus,
    currentMenuCd: navigation.currentMenu?.menuCd,
    breadcrumb: navigation.breadcrumb
      ? {
          depth1: navigation.breadcrumb.depth1,
          depth2: navigation.breadcrumb.depth2,
          depth3: navigation.breadcrumb.current,
        }
      : null,
  };
}
