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
  breadcrumb: ClientMenuBreadcrumb | null;
};

export const CLIENT_ROOT_MENU_CD = 'CLIENT';

export const CLIENT_SECTIONS: { key: ClientSection; label: string }[] = [
  { key: 'store', label: '매장' },
  { key: 'menu', label: '메뉴' },
  { key: 'order', label: '주문' },
  { key: 'payment', label: '결제' },
  { key: 'board', label: '게시판' },
];

export const CLIENT_MENUS_BY_SECTION: Record<ClientSection, SidebarNavDepth1[]> = {
  store: [
    {
      key: 'store-root',
      label: '매장',
      groups: [
        {
          key: 'store-user-manage',
          label: '유저 관리',
          items: [{ key: 'store-users', label: '유저 정보 관리', path: '/client/store/users' }],
        },
        {
          key: 'store-info-manage',
          label: '매장 정보 관리',
          items: [{ key: 'store-info', label: '매장 기본 정보', path: '/client/store/info' }],
        },
        {
          key: 'store-table-manage',
          label: '테이블 정보 관리',
          items: [
            { key: 'store-tables', label: '테이블 관리', path: '/client/store/tables' },
            { key: 'store-qr', label: 'QR코드 관리', path: '/client/store/qr' },
          ],
        },
      ],
    },
  ],
  menu: [
    {
      key: 'menu-root',
      label: '메뉴',
      groups: [
        {
          key: 'menu-info-manage',
          label: '메뉴 정보 관리',
          items: [
            { key: 'menu-categories', label: '메뉴 관리', path: '/client/menu/categories' },
            { key: 'menu-options', label: '옵션 관리', path: '/client/menu/options' },
          ],
        },
      ],
    },
  ],
  order: [
    {
      key: 'order-root',
      label: '주문',
      groups: [
        {
          key: 'order-current-manage',
          label: '주문 현황',
          items: [
            { key: 'order-current', label: '실시간 주문 조회', path: '/client/order/current' },
            { key: 'order-status', label: '주문 상태 관리', path: '/client/order/status' },
          ],
        },
        {
          key: 'order-history-manage',
          label: '주문 이력',
          items: [{ key: 'order-history', label: '주문 이력 조회', path: '/client/order/history' }],
        },
      ],
    },
  ],
  payment: [
    {
      key: 'payment-root',
      label: '결제',
      groups: [
        {
          key: 'payment-status',
          label: '결제 현황',
          items: [{ key: 'payment-list', label: '결제 목록 조회', path: '/client/payment/list' }],
        },
        {
          key: 'settlement-manage',
          label: '정산 관리',
          items: [{ key: 'settlement', label: '정산 조회', path: '/client/settlement' }],
        },
      ],
    },
  ],
  board: [
    {
      key: 'board-root',
      label: '게시판',
      groups: [
        {
          key: 'board-notice-manage',
          label: '공지사항',
          items: [{ key: 'board-notice', label: '공지사항 조회', path: '/client/board/notice' }],
        },
        {
          key: 'board-qna-manage',
          label: '문의사항',
          items: [{ key: 'board-qna', label: '문의사항', path: '/client/board/qna' }],
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

function createFallbackClientNavigationData(pathname: string): ClientNavigationData {
  const currentSection = findClientSectionByPath(pathname);

  return {
    headerSections: CLIENT_SECTIONS,
    menusBySection: CLIENT_MENUS_BY_SECTION,
    currentSection,
    currentMenus: currentSection ? CLIENT_MENUS_BY_SECTION[currentSection] ?? [] : [],
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
    breadcrumb: navigation.breadcrumb
      ? {
          depth1: navigation.breadcrumb.depth1,
          depth2: navigation.breadcrumb.depth2,
          depth3: navigation.breadcrumb.current,
        }
      : null,
  };
}
