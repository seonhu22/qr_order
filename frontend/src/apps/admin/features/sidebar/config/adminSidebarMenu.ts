// src/apps/admin/features/sidebar/config/adminSidebarMenu.ts

/**
 * @fileoverview 관리자 사이드바 메뉴 데이터
 *
 * @description
 * - 현재 단계에서는 UI 렌더링과 라우트 구조 확인을 위한 정적 메뉴 데이터만 관리한다.
 * - 추후 Zustand 상태와 실제 라우트 활성값을 연결할 때 이 구조를 기준으로 확장한다.
 *
 * @param {never} _unused 이 파일은 상수 데이터만 내보낸다.
 * @example
 * import { ADMIN_SIDEBAR_MENU } from '@/apps/admin/features/sidebar/config/adminSidebarMenu';
 */

export const ADMIN_SIDEBAR_MENU = [
  {
    key: 'system',
    label: '시스템',
    groups: [
      {
        key: 'systemManagement',
        label: '시스템',
        items: [
          { key: 'commonCode', label: '공통코드 관리', path: '/admin/system/common-code' },
          { key: 'plantSearch', label: '사업장 조회', path: '/admin/system/plant' },
          { key: 'adminUser', label: '관리자 관리', path: '/admin/system/admin-user' },
          { key: 'menu', label: '메뉴 관리', path: '/admin/system/menu' },
          { key: 'message', label: '메시지 관리', path: '/admin/system/message' },
          { key: 'rule', label: '규칙 관리', path: '/admin/system/rule' },
        ],
      },
      {
        key: 'paymentManagement',
        label: '결제 관리',
        items: [
          { key: 'paymentRate', label: '결제 요금 관리', path: '/admin/payment/rate' },
          { key: 'plantStatus', label: '사업장 상태 조회', path: '/admin/payment/plant-status' },
          { key: 'coupon', label: '쿠폰 관리', path: '/admin/payment/coupon' },
        ],
      },
      {
        key: 'logManagement',
        label: '이력 관리',
        items: [
          { key: 'accessLog', label: '접속 정보 조회', path: '/admin/history/access-log' },
          { key: 'auditLog', label: '변경 이력 조회', path: '/admin/history/audit-log' },
        ],
      },
    ],
  },
] as const;
