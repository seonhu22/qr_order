// 클라이언트 메뉴 데이터 — 실제 화면 구현 전에도 라우트와 URL 규칙은 이 파일을 기준으로 맞춘다.
import type { SidebarNavDepth1 } from '@/shared/components/sidebar/types';

export type ClientSection = 'store' | 'menu' | 'order' | 'payment' | 'board';

export const CLIENT_SECTIONS: { key: ClientSection; label: string }[] = [
  { key: 'store', label: '매장 관리' },
  { key: 'menu', label: '메뉴 관리' },
  { key: 'order', label: '주문 관리' },
  { key: 'payment', label: '결제 관리' },
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

export function findClientExpandedMenuKeys(pathname: string) {
  for (const depth1 of CLIENT_SIDEBAR_MENUS) {
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
