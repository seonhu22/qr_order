// 클라이언트 임시 메뉴 데이터 — 백엔드 연동 전 플레이스홀더 (ADR-004 참고)
import type { SidebarNavDepth1 } from '@/shared/components/sidebar/types';

export type ClientSection = 'order' | 'store';

export const CLIENT_SECTIONS: { key: ClientSection; label: string }[] = [
  { key: 'order', label: '주문' },
  { key: 'store', label: '매장' },
];

export const CLIENT_MENUS_BY_SECTION: Record<ClientSection, SidebarNavDepth1[]> = {
  order: [
    {
      key: 'order-root',
      label: '주문',
      groups: [
        {
          key: 'order-manage',
          label: '주문 관리',
          items: [
            { key: 'order-current', label: '주문 현황', path: '/client/order/current' },
            { key: 'order-history', label: '주문 내역', path: '/client/order/history' },
          ],
        },
      ],
    },
  ],
  store: [
    {
      key: 'store-root',
      label: '매장',
      groups: [
        {
          key: 'menu-manage',
          label: '메뉴 관리',
          items: [
            { key: 'menu-list', label: '메뉴 목록', path: '/client/store/menu' },
          ],
        },
        {
          key: 'table-manage',
          label: '테이블 관리',
          items: [
            { key: 'table-list', label: '테이블 목록', path: '/client/store/table' },
          ],
        },
      ],
    },
  ],
};
