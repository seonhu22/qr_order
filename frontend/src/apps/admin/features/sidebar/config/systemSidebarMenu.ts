// src/apps/admin/features/sidebar/config/systemSidebarMenu.ts

export const SYSTEM_SIDEBAR_MENU = [
  {
    key: 'system',
    label: '시스템',
    groups: [
      {
        key: 'systemManagement',
        label: '시스템 관리',
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
