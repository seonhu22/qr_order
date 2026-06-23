// src/shared/api/queryKeys.ts

const commonCodeMasterListsKey = ['settings', 'common', 'masters'] as const;
const commonCodeDetailListsKey = ['settings', 'common', 'details'] as const;
const plantListsKey = ['settings', 'plant', 'list'] as const;
const adminUserListsKey = ['settings', 'adminUser', 'list'] as const;
const messageListsKey = ['settings', 'message', 'list'] as const;
const paymentListsKey = ['settings', 'payment', 'list'] as const;
const plantStatusListsKey = ['settings', 'plantStatus', 'list'] as const;
const couponListsKey = ['settings', 'coupon', 'list'] as const;
const clientUserListsKey = ['client', 'storeUser', 'list'] as const;
const storeTableListsKey = ['client', 'storeTable', 'list'] as const;
const qrCodeListsKey = ['client', 'qrCode', 'list'] as const;
const ruleMasterListsKey = ['settings', 'rule', 'masters'] as const;
const ruleDetailListsKey = ['settings', 'rule', 'details'] as const;
const accessLogMasterListsKey = ['settings', 'accessLog', 'masters'] as const;
const changeHistoryListsKey = ['settings', 'changeHistory', 'list'] as const;
const noticeListsKey = ['board', 'notice', 'list'] as const;
const qnaListsKey = ['board', 'qna', 'list'] as const;
const menuManagementMasterListsKey = ['client', 'menuManagement', 'masters'] as const;
const menuManagementDetailListsKey = ['client', 'menuManagement', 'details'] as const;
const menuOptionMasterListsKey = ['client', 'menuOption', 'masters'] as const;
const menuOptionGroupListsKey = ['client', 'menuOption', 'groups'] as const;
const menuOptionDetailListsKey = ['client', 'menuOption', 'details'] as const;
const orderHistoryListsKey = ['client', 'orderHistory', 'list'] as const;

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
    list: () => ['settings', 'menu', 'list'] as const,
  },
  dashboard: {
    info: ['dashboard', 'info'] as const,
  },
  commonCode: {
    masterLists: commonCodeMasterListsKey,
    detailLists: commonCodeDetailListsKey,
    masters: (searchKeyword = '') => [...commonCodeMasterListsKey, { searchKeyword }] as const,
    details: (masterId = '', searchKeyword = '') =>
      [...commonCodeDetailListsKey, masterId, { searchKeyword }] as const,
  },
  plant: {
    lists: plantListsKey,
    list: (searchKeyword = '') => [...plantListsKey, { searchKeyword }] as const,
  },
  adminUser: {
    lists: adminUserListsKey,
  },
  message: {
    lists: messageListsKey,
  },
  payment: {
    lists: paymentListsKey,
    list: (searchKeyword = '') => [...paymentListsKey, { searchKeyword }] as const,
  },
  plantStatus: {
    lists: plantStatusListsKey,
    list: (searchKeyword = '') => [...plantStatusListsKey, { searchKeyword }] as const,
  },
  coupon: {
    lists: couponListsKey,
    list: (searchKeyword = '') => [...couponListsKey, { searchKeyword }] as const,
  },
  clientUser: {
    lists: clientUserListsKey,
    list: (searchKeyword = '') => [...clientUserListsKey, { searchKeyword }] as const,
  },
  rule: {
    masterLists: ruleMasterListsKey,
    detailLists: ruleDetailListsKey,
    masters: (searchKeyword = '') => [...ruleMasterListsKey, { searchKeyword }] as const,
    details: (masterId = '') => [...ruleDetailListsKey, masterId] as const,
  },
  accessLog: {
    masterLists: accessLogMasterListsKey,
    masters: (params: { startDate: string; endDate: string; searchKeyword?: string }) =>
      [...accessLogMasterListsKey, params] as const,
    details: (sysId = '') => ['settings', 'accessLog', 'details', sysId] as const,
  },
  changeHistory: {
    lists: changeHistoryListsKey,
    list: (params: {
      startDate: string;
      endDate: string;
      searchKeyword?: string;
      auditFlag?: string;
      changeType: string;
    }) =>
      [...changeHistoryListsKey, params] as const,
  },
  notice: {
    lists: noticeListsKey,
    list: (searchKeyword = '') => [...noticeListsKey, { searchKeyword }] as const,
  },
  qna: {
    lists: qnaListsKey,
    list: (searchKeyword = '') => [...qnaListsKey, { searchKeyword }] as const,
  },
  storeTable: {
    lists: storeTableListsKey,
  },
  qrCode: {
    lists: qrCodeListsKey,
  },
  menuManagement: {
    masterLists: menuManagementMasterListsKey,
    detailLists: menuManagementDetailListsKey,
    masters: (searchKeyword = '') => [...menuManagementMasterListsKey, { searchKeyword }] as const,
    details: (masterId = '') => [...menuManagementDetailListsKey, masterId] as const,
  },
  menuOption: {
    masterLists: menuOptionMasterListsKey,
    groupLists: menuOptionGroupListsKey,
    detailLists: menuOptionDetailListsKey,
    masters: (searchKeyword = '') => [...menuOptionMasterListsKey, { searchKeyword }] as const,
    groups: (masterId = '') => [...menuOptionGroupListsKey, masterId] as const,
    details: (groupId = '') => [...menuOptionDetailListsKey, groupId] as const,
  },
  orderHistory: {
    lists: orderHistoryListsKey,
    list: (params: {
      startDate: string;
      endDate: string;
      searchKeyword?: string;
      orderStatus?: string;
    }) => [...orderHistoryListsKey, params] as const,
  },
} as const;
