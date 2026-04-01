// src/shared/api/queryKeys.ts

/**
 * React Query 캐시 관리를 위한 쿼리 키 모음
 *
 * @property auth.me - 현재 로그인한 사용자 정보 쿼리 키
 * @property menu.admin - 어드민 메뉴 쿼리 키
 * @property dashboard.info - 대시보드 정보 쿼리 키
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  menu: {
    admin: ['menu', 'admin'] as const,
  },
  dashboard: {
    info: ['dashboard', 'info'] as const,
  },
} as const;
