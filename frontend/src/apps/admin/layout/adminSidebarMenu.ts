// src/apps/admin/layout/adminSidebarMenu.ts

/**
 * @fileoverview 관리자 사이드바 메뉴 데이터
 *
 * @description
 * - 현재 단계에서는 UI 렌더링과 라우트 구조 확인을 위한 정적 메뉴 데이터만 관리한다.
 * - 추후 Zustand 상태와 실제 라우트 활성값을 연결할 때 이 구조를 기준으로 확장한다.
 *
 * @param {never} _unused 이 파일은 상수 데이터만 내보낸다.
 * @example
 * import { ADMIN_SIDEBAR_MENU } from '@/apps/admin/layout/adminSidebarMenu';
 */

export const ADMIN_SIDEBAR_MENU = [
  {
    key: 'system',
    label: '시스템',
    groups: [
      {
        key: 'systemSettings',
        label: '시스템 관리',
        items: [
          { key: 'commonCode', label: '공통코드 관리', active: true },
          { key: 'plant', label: '사업장 조회', active: false },
          { key: 'adminUser', label: '관리자 관리', active: false },
          { key: 'menu', label: '메뉴 관리', active: false },
          { key: 'message', label: '메시지 관리', active: false },
          { key: 'rule', label: '규칙 관리', active: false },
        ],
      },
      {
        key: 'billManagement',
        label: '결제 관리',
        items: [],
      },
      {
        key: 'logManagement',
        label: '이력 관리',
        items: [],
      },
    ],
  },
  {
    key: 'bill',
    label: '결제 관리',
    groups: [],
  },
  {
    key: 'history',
    label: '이력 관리',
    groups: [],
  },
] as const;
