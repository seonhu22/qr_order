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
  commonCode: {
    masters: (searchKeyword = '') => ['settings', 'common', 'masters', { searchKeyword }] as const,
    details: (masterId = '', searchKeyword = '') =>
      ['settings', 'common', 'details', masterId, { searchKeyword }] as const,
  },
  plant: {
    list: (searchKeyword = '') => ['settings', 'plant', 'list', { searchKeyword }] as const,
  },
  adminUser: {
    list: (searchKeyword = '') => ['settings', 'adminUser', 'list', { searchKeyword }] as const,
  },
  message: {
    list: (searchKeyword = '') => ['settings', 'message', 'list', { searchKeyword }] as const,
  },
  payment: {
    list: (searchKeyword = '') => ['settings', 'payment', 'list', { searchKeyword }] as const,
  },
  plantStatus: {
    list: (searchKeyword = '') => ['settings', 'plantStatus', 'list', { searchKeyword }] as const,
  },
  coupon: {
    list: (searchKeyword = '') => ['settings', 'coupon', 'list', { searchKeyword }] as const,
  },
  accessLog: {
    masters: (params: { startDate: string; endDate: string; searchKeyword?: string }) =>
      ['settings', 'accessLog', 'masters', params] as const,
    details: (sysId = '') => ['settings', 'accessLog', 'details', sysId] as const,
  },
  changeHistory: {
    list: (params: { startDate: string; endDate: string; searchKeyword?: string }) =>
      ['settings', 'changeHistory', 'list', params] as const,
  },
  notice: {
    list: (searchKeyword = '') => ['board', 'notice', 'list', { searchKeyword }] as const,
  },
  qna: {
    list: (searchKeyword = '') => ['board', 'qna', 'list', { searchKeyword }] as const,
  },
} as const;
