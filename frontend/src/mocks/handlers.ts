import { http, HttpResponse } from 'msw';
import { handlers as authHandlers } from '../test/handlers';
import { INQUIRY_MANAGE_MOCK_ROWS } from '../apps/admin/features/inquiry-manage/mock/inquiryManageMock';
import { NOTICE_MOCK_ROWS } from '../apps/admin/features/notice-manage/mock/noticeManageMock';
import { CHANGE_HISTORY_MOCK } from '../apps/admin/features/change-history/mock/changeHistoryMock';
import {
  getDelCommonMasterMockHandler,
  getDelPaymentMockHandler,
  getDelPlantMockHandler,
  getDelRuleMasterMockHandler,
  getGetPaymentCouponMockHandler,
  getGetPaymentMockHandler,
  getGetPlantStatusMockHandler,
  getGetRuleDetailMockHandler,
  getGetRuleMasterMockHandler,
  getNewCommonMasterMockHandler,
  getNewPaymentMockHandler,
  getNewPlantMockHandler,
  getNewRuleMasterMockHandler,
  getSaveCommonDetailMockHandler,
  getSaveMenuMockHandler,
  getSavePaymentCouponMockHandler,
  getSearchCommonDetailMockHandler,
  getSearchCommonMockHandler,
  getSearchPlantMockHandler,
  getUpdateCommonMasterMockHandler,
  getUpdatePaymentMockHandler,
  getUpdatePlantMockHandler,
  getUpdateRuleMasterMockHandler,
  getSaveRuleMockHandler,
  getUpdateQnaMockHandler,
  getUpdateNoticeMockHandler,
  getNewNoticeMockHandler,
  getDelNoticeMockHandler,
  getGetSysAccessLogMasterMockHandler,
  getGetSysAccessLogDetailMockHandler,
  getGetAuditTrailMockHandler,
} from '../generated/settings-controller/settings-controller.msw';
import { getComboControllerMock } from '../generated/combo-controller/combo-controller.msw';
import { getFileControllerMock } from '../generated/file-controller/file-controller.msw';
import { getLogControllerMock } from '../generated/log-controller/log-controller.msw';
import { getMainControllerMock } from '../generated/main-controller/main-controller.msw';
import { getPopupControllerMock } from '../generated/popup-controller/popup-controller.msw';
import { ADMIN_USER_MOCK_ROWS } from '../apps/admin/features/admin-user/mock/adminUserMock';
import { MESSAGE_MOCK_ROWS } from '../apps/admin/features/message/mock/messageMock';
import { PAYMENT_MOCK_ROWS } from '../apps/admin/features/payment-manage/mock/paymentManageMock';
import { PLANT_STATUS_MOCK_ROWS } from '../apps/admin/features/plant-status/mock/plantStatusMock';
import { COUPON_MOCK_ROWS } from '../apps/admin/features/coupon-manage/mock/couponManageMock';
import { CLIENT_USER_MOCK_ROWS } from '../apps/client/features/client-user/mock/clientUserMock';
import {
  PAYMENT_STATUS_DETAIL_MOCK,
  PAYMENT_STATUS_MASTER_MOCK,
} from '../apps/client/features/payment-status/mock/paymentStatusMock';
import {
  SETTLEMENT_DAILY_SALES_MOCK,
  buildSettlementMockResponse,
} from '../apps/client/features/settlement/mock/settlementMock';
import { STORE_INFO_MOCK_ROWS } from '../apps/client/features/store-info/mock/storeInfoMock';
import { STORE_TABLE_MOCK_ROWS } from '../apps/client/features/store-table/mock/storeTableMock';
import { QR_CODE_MOCK_ROWS } from '../apps/client/features/qr-code/mock/qrCodeMock';
import {
  MENU_CATEGORY_MOCK_ROWS,
  MENU_DETAIL_MOCK_ROWS,
} from '../apps/client/features/menu-management/mock/menuManagementMock';
import {
  MENU_OPTION_DETAIL_MOCK_ROWS,
  MENU_OPTION_GROUP_MOCK_ROWS,
  MENU_OPTION_MASTER_MOCK_ROWS,
} from '../apps/client/features/menu-option/mock/menuOptionMock';
import {
  getDelClientUserMockHandler,
  getGetStoreInfoMockHandler,
  getGetTableInfo1MockHandler,
  getNewClientUserMockHandler,
  getResetPwdMockHandler,
  getSaveStoreInfoMockHandler,
  getUpdateClientUserMockHandler,
} from '../generated/store-manage-controller/store-manage-controller.msw';
import type { TableInfoRequest } from '../generated/types/tableInfoRequest';
import type { MessageRequest } from '../generated/types/messageRequest';
import type { AdminUserRequest } from '../generated/types/adminUserRequest';
import type { QrCodeRequest } from '../apps/client/features/qr-code/api/qrCodeApi';
import type { MenuMasterItem } from '../generated/types/menuMasterItem';
import type { MenuMasterRequest } from '../generated/types/menuMasterRequest';
import type { MenuDetailRequest } from '../generated/types/menuDetailRequest';
import type { MenuOptionGroupItem } from '../generated/types/menuOptionGroupItem';
import type { MenuOptionGroupRequest } from '../generated/types/menuOptionGroupRequest';
import type { MenuOptionDetailRequest } from '../generated/types/menuOptionDetailRequest';

const CHANGE_TYPE_AUDIT_FLAG_MAP: Record<string, string> = {
  '01': 'I',
  '02': 'U',
  '03': 'D',
};

function toMockDate(value: string | null) {
  return value ? new Date(value.replace(' ', 'T')).getTime() : null;
}

const paymentOverrideHandler = http.get('*/api/system/settings/payment/search', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
  const filtered = keyword
    ? PAYMENT_MOCK_ROWS.filter(
        (row) =>
          row.paymentCd?.toLowerCase().includes(keyword) ||
          row.paymentNm?.toLowerCase().includes(keyword),
      )
    : PAYMENT_MOCK_ROWS;
  return HttpResponse.json(filtered);
});

const plantStatusOverrideHandler = http.get(
  '*/api/system/settings/plant_status/search',
  ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const filtered = keyword
      ? PLANT_STATUS_MOCK_ROWS.filter(
          (row) =>
            row.plantCd?.toLowerCase().includes(keyword) ||
            row.paymentCd?.toLowerCase().includes(keyword),
        )
      : PLANT_STATUS_MOCK_ROWS;
    return HttpResponse.json(filtered);
  },
);

const couponOverrideHandler = http.get(
  '*/api/system/settings/payment_coupon/search',
  ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const filtered = keyword
      ? COUPON_MOCK_ROWS.filter(
          (row) =>
            row.couponCd?.toLowerCase().includes(keyword) ||
            row.couponNm?.toLowerCase().includes(keyword),
        )
      : COUPON_MOCK_ROWS;
    return HttpResponse.json(filtered);
  },
);

const adminUserOverrideHandler = http.get(
  '*/api/system/settings/adminuser/search',
  ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const filtered = keyword
      ? ADMIN_USER_MOCK_ROWS.filter(
          (row) =>
            row.userId?.toLowerCase().includes(keyword) ||
            row.userNm?.toLowerCase().includes(keyword) ||
            row.plantNm?.toLowerCase().includes(keyword),
        )
      : ADMIN_USER_MOCK_ROWS;
    return HttpResponse.json(filtered);
  },
);

const adminUserSaveOverrideHandler = http.post(
  '*/api/system/settings/adminuser/save',
  async ({ request }) => {
    const body = (await request.json()) as AdminUserRequest;

    body.newItems?.forEach((item) => {
      ADMIN_USER_MOCK_ROWS.push({
        ...item,
        sysId: `admin-${Date.now()}-${ADMIN_USER_MOCK_ROWS.length}`,
      });
    });
    body.updateItems?.forEach((item) => {
      const target = ADMIN_USER_MOCK_ROWS.find((row) => row.sysId === item.sysId);
      if (target) Object.assign(target, item);
    });
    body.delItems?.forEach((item) => {
      const index = ADMIN_USER_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) ADMIN_USER_MOCK_ROWS.splice(index, 1);
    });

    return HttpResponse.json({ success: true });
  },
);

const messageOverrideHandler = http.get(
  '*/api/system/settings/message/search',
  ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const filtered = keyword
      ? MESSAGE_MOCK_ROWS.filter(
          (row) =>
            row.msgCd?.toLowerCase().includes(keyword) ||
            row.msgNm?.toLowerCase().includes(keyword) ||
            row.msgDescription?.toLowerCase().includes(keyword),
        )
      : MESSAGE_MOCK_ROWS;
    return HttpResponse.json(filtered);
  },
);

const messageSaveOverrideHandler = http.post(
  '*/api/system/settings/message/save',
  async ({ request }) => {
    const body = (await request.json()) as MessageRequest;

    body.newItems?.forEach((item) => {
      MESSAGE_MOCK_ROWS.push({ ...item, sysId: `msg-${Date.now()}-${MESSAGE_MOCK_ROWS.length}` });
    });
    body.updateItems?.forEach((item) => {
      const target = MESSAGE_MOCK_ROWS.find((row) => row.sysId === item.sysId);
      if (target) Object.assign(target, item);
    });
    body.delItems?.forEach((item) => {
      const index = MESSAGE_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) MESSAGE_MOCK_ROWS.splice(index, 1);
    });

    return HttpResponse.json({ success: true });
  },
);

const storeInfoOverrideHandler = getGetStoreInfoMockHandler(STORE_INFO_MOCK_ROWS);

const storeTableOverrideHandler = getGetTableInfo1MockHandler(STORE_TABLE_MOCK_ROWS);

const storeTableSaveOverrideHandler = http.post(
  '*/api/client/store_manage/table_info/save',
  async ({ request }) => {
    const body = (await request.json()) as TableInfoRequest;

    body.newItems?.forEach((item) => {
      STORE_TABLE_MOCK_ROWS.push({
        ...item,
        sysId: `table-${Date.now()}-${STORE_TABLE_MOCK_ROWS.length}`,
      });
    });
    body.updateItems?.forEach((item) => {
      const target = STORE_TABLE_MOCK_ROWS.find((row) => row.sysId === item.sysId);
      if (target) Object.assign(target, item);
    });
    body.delItems?.forEach((item) => {
      const index = STORE_TABLE_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) STORE_TABLE_MOCK_ROWS.splice(index, 1);
    });

    return HttpResponse.json({ success: true });
  },
);

const qrCodeOverrideHandler = http.get('*/api/client/store_manage/table_qr/search', () => {
  return HttpResponse.json(QR_CODE_MOCK_ROWS);
});

const qrCodeSaveOverrideHandler = http.post(
  '*/api/client/store_manage/table_qr/save',
  async ({ request }) => {
    const body = (await request.json()) as QrCodeRequest;

    body.newItems?.forEach((item) => {
      QR_CODE_MOCK_ROWS.push({
        ...item,
        sysId: `qr-code-${Date.now()}-${QR_CODE_MOCK_ROWS.length}`,
      });
    });
    body.updateItems?.forEach((item) => {
      const target = QR_CODE_MOCK_ROWS.find((row) => row.sysId === item.sysId);
      if (target) Object.assign(target, item);
    });
    body.delItems?.forEach((item) => {
      const index = QR_CODE_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) QR_CODE_MOCK_ROWS.splice(index, 1);
    });

    return HttpResponse.json({ success: true });
  },
);

const pwdChkOverrideHandler = http.get('*/api/client/store_manage/store_info/pwd_chk', ({ request }) => {
  const url = new URL(request.url);
  const pwd = url.searchParams.get('pwd');
  return HttpResponse.json(pwd === '1');
});

const clientUserOverrideHandler = http.get(
  '*/api/client/store_manage/user_manage/search',
  ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const filtered = keyword
      ? CLIENT_USER_MOCK_ROWS.filter(
          (row) =>
            row.userId?.toLowerCase().includes(keyword) ||
            row.userNm?.toLowerCase().includes(keyword),
        )
      : CLIENT_USER_MOCK_ROWS;
    return HttpResponse.json(filtered);
  },
);

const menuCategoryOverrideHandler = http.get(
  '*/api/client/menu_manage/menu/master/search',
  ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const filtered = keyword
      ? MENU_CATEGORY_MOCK_ROWS.filter((row) =>
          row.categoryName?.toLowerCase().includes(keyword),
        )
      : MENU_CATEGORY_MOCK_ROWS;
    return HttpResponse.json(filtered);
  },
);

const menuCategoryNewOverrideHandler = http.post(
  '*/api/client/menu_manage/menu/master/new',
  async ({ request }) => {
    const body = (await request.json()) as MenuMasterRequest;
    MENU_CATEGORY_MOCK_ROWS.push({
      ...body,
      sysId: `category-${Date.now()}`,
      ordNo: MENU_CATEGORY_MOCK_ROWS.length + 1,
    });
    return HttpResponse.json({ success: true });
  },
);

const menuCategoryUpdateOverrideHandler = http.post(
  '*/api/client/menu_manage/menu/master/update',
  async ({ request }) => {
    const body = (await request.json()) as MenuMasterRequest;
    const target = MENU_CATEGORY_MOCK_ROWS.find((row) => row.sysId === body.sysId);
    if (target) Object.assign(target, body);
    return HttpResponse.json({ success: true });
  },
);

const menuCategoryDeleteOverrideHandler = http.post(
  '*/api/client/menu_manage/menu/master/del',
  async ({ request }) => {
    const body = (await request.json()) as MenuMasterItem[];
    body.forEach((item) => {
      const index = MENU_CATEGORY_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) MENU_CATEGORY_MOCK_ROWS.splice(index, 1);
    });
    return HttpResponse.json({ success: true });
  },
);

const paymentStatusMasterOverrideHandler = http.get(
  '*/api/client/payment_manage/history/master/search',
  ({ request }) => {
    const url = new URL(request.url);
    const paymentStatus = url.searchParams.get('paymentStatus') ?? '';
    const startMs = toMockDate(url.searchParams.get('startDate'));
    const endMs = toMockDate(url.searchParams.get('endDate'));

    const filtered = PAYMENT_STATUS_MASTER_MOCK.filter((row) => {
      const matchesStatus = paymentStatus ? row.orderStatus === paymentStatus : true;
      const rowMs = toMockDate(row.orderDatetime ?? '');
      const matchesStart = startMs !== null && rowMs !== null ? rowMs >= startMs : true;
      const matchesEnd = endMs !== null && rowMs !== null ? rowMs <= endMs : true;
      return matchesStatus && matchesStart && matchesEnd;
    });

    return HttpResponse.json(filtered);
  },
);

const paymentStatusDetailOverrideHandler = http.get(
  '*/api/client/payment_manage/history/detail/search/:masterSysId',
  ({ params }) => {
    const filtered = PAYMENT_STATUS_DETAIL_MOCK.filter((row) => row.sysId === params.masterSysId);
    return HttpResponse.json(filtered);
  },
);

const settlementOverrideHandler = http.get(
  '*/api/client/payment_manage/settlement/search',
  ({ request }) => {
    const url = new URL(request.url);
    const startMs = toMockDate(url.searchParams.get('searchStartDate'));
    const endMs = toMockDate(url.searchParams.get('searchEndDate'));

    const filteredDailySales = SETTLEMENT_DAILY_SALES_MOCK.filter((row) => {
      const rowMs = toMockDate(row.groupDate ?? '');
      const matchesStart = startMs !== null && rowMs !== null ? rowMs >= startMs : true;
      const matchesEnd = endMs !== null && rowMs !== null ? rowMs <= endMs : true;
      return matchesStart && matchesEnd;
    });

    return HttpResponse.json(buildSettlementMockResponse(filteredDailySales));
  },
);

const menuDetailOverrideHandler = http.get(
  '*/api/client/menu_manage/menu/detail/search/:masterSysId',
  ({ params }) => {
    const filtered = MENU_DETAIL_MOCK_ROWS.filter((row) => row.linkSysId === params.masterSysId);
    return HttpResponse.json(filtered);
  },
);

const menuDetailSaveOverrideHandler = http.post(
  '*/api/client/menu_manage/menu/detail/save',
  async ({ request }) => {
    const body = (await request.json()) as MenuDetailRequest;

    body.newItems?.forEach((item) => {
      MENU_DETAIL_MOCK_ROWS.push({ ...item, sysId: `menu-${Date.now()}-${MENU_DETAIL_MOCK_ROWS.length}` });
    });
    body.updateItems?.forEach((item) => {
      const target = MENU_DETAIL_MOCK_ROWS.find((row) => row.sysId === item.sysId);
      if (target) Object.assign(target, item);
    });
    body.delItems?.forEach((item) => {
      const index = MENU_DETAIL_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) MENU_DETAIL_MOCK_ROWS.splice(index, 1);
    });

    return HttpResponse.json({ success: true });
  },
);

const menuOptionMasterOverrideHandler = http.get(
  '*/api/client/menu_manage/option/master/search',
  ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const filtered = keyword
      ? MENU_OPTION_MASTER_MOCK_ROWS.filter((row) =>
          row.categoryName?.toLowerCase().includes(keyword),
        )
      : MENU_OPTION_MASTER_MOCK_ROWS;
    return HttpResponse.json(filtered);
  },
);

const menuOptionGroupOverrideHandler = http.get(
  '*/api/client/menu_manage/option/group/search/:masterSysId',
  ({ params }) => {
    const filtered = MENU_OPTION_GROUP_MOCK_ROWS.filter(
      (row) => row.linkSysId === params.masterSysId,
    );
    return HttpResponse.json(filtered);
  },
);

const menuOptionGroupNewOverrideHandler = http.post(
  '*/api/client/menu_manage/option/group/new',
  async ({ request }) => {
    const body = (await request.json()) as MenuOptionGroupRequest;
    MENU_OPTION_GROUP_MOCK_ROWS.push({
      ...body,
      sysId: `option-group-${Date.now()}`,
    });
    return HttpResponse.json({ success: true });
  },
);

const menuOptionGroupUpdateOverrideHandler = http.post(
  '*/api/client/menu_manage/option/group/update',
  async ({ request }) => {
    const body = (await request.json()) as MenuOptionGroupRequest;
    const target = MENU_OPTION_GROUP_MOCK_ROWS.find((row) => row.sysId === body.sysId);
    if (target) Object.assign(target, body);
    return HttpResponse.json({ success: true });
  },
);

const menuOptionGroupDeleteOverrideHandler = http.post(
  '*/api/client/menu_manage/option/group/del',
  async ({ request }) => {
    const body = (await request.json()) as MenuOptionGroupItem[];
    body.forEach((item) => {
      const index = MENU_OPTION_GROUP_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) MENU_OPTION_GROUP_MOCK_ROWS.splice(index, 1);
    });
    return HttpResponse.json({ success: true });
  },
);

const menuOptionDetailOverrideHandler = http.get(
  '*/api/client/menu_manage/option/detail/search/:groupSysId',
  ({ params }) => {
    const filtered = MENU_OPTION_DETAIL_MOCK_ROWS.filter(
      (row) => row.linkSysId === params.groupSysId,
    );
    return HttpResponse.json(filtered);
  },
);

const menuOptionDetailSaveOverrideHandler = http.post(
  '*/api/client/menu_manage/option/detail/save',
  async ({ request }) => {
    const body = (await request.json()) as { menuOptionDetailRequest: MenuOptionDetailRequest };
    const { menuOptionDetailRequest: detailRequest } = body;

    detailRequest.newItems?.forEach((item) => {
      MENU_OPTION_DETAIL_MOCK_ROWS.push({
        ...item,
        sysId: `option-detail-${Date.now()}-${MENU_OPTION_DETAIL_MOCK_ROWS.length}`,
      });
    });
    detailRequest.updateItems?.forEach((item) => {
      const target = MENU_OPTION_DETAIL_MOCK_ROWS.find((row) => row.sysId === item.sysId);
      if (target) Object.assign(target, item);
    });
    detailRequest.delItems?.forEach((item) => {
      const index = MENU_OPTION_DETAIL_MOCK_ROWS.findIndex((row) => row.sysId === item.sysId);
      if (index !== -1) MENU_OPTION_DETAIL_MOCK_ROWS.splice(index, 1);
    });

    return HttpResponse.json({ success: true });
  },
);

const menuOverrideHandler = http.get('*/api/system/settings/menu/search', () => {
  return HttpResponse.json([
    { sysId: 'a0', menuCd: 'ADMIN', menuNm: '관리자', parentMenuCd: 'ROOT', ordNo: '1', treeLevel: '0' },
    { sysId: 'c0', menuCd: 'CLIENT', menuNm: '클라이언트', parentMenuCd: 'ROOT', ordNo: '2', treeLevel: '0' },
    { sysId: 'm6', menuCd: 'system', menuNm: '시스템', parentMenuCd: 'ADMIN', ordNo: '1', treeLevel: '1' },
    { sysId: 'm1', menuCd: 'board', menuNm: '게시판', parentMenuCd: 'ADMIN', ordNo: '2', treeLevel: '1' },
    { sysId: 'm2', menuCd: 'notice', menuNm: '공지사항', parentMenuCd: 'board', ordNo: '1', treeLevel: '2' },
    { sysId: 'm3', menuCd: 'noticeManage', menuNm: '공지사항 관리', parentMenuCd: 'notice', ordNo: '1', treeLevel: '3', menuUrl: '/admin/notice/manage' },
    { sysId: 'm4', menuCd: 'inquiry', menuNm: '문의사항', parentMenuCd: 'board', ordNo: '2', treeLevel: '2' },
    { sysId: 'm5', menuCd: 'inquiryManage', menuNm: '문의사항 관리', parentMenuCd: 'inquiry', ordNo: '1', treeLevel: '3', menuUrl: '/admin/inquiry/manage' },
    { sysId: 'm7', menuCd: 'systemManagement', menuNm: '시스템 관리', parentMenuCd: 'system', ordNo: '1', treeLevel: '2' },
    { sysId: 'm8', menuCd: 'commonCode', menuNm: '공통코드 관리', parentMenuCd: 'systemManagement', ordNo: '1', treeLevel: '3', menuUrl: '/admin/system/common-code' },
    { sysId: 'm9', menuCd: 'plantSearch', menuNm: '사업장 조회', parentMenuCd: 'systemManagement', ordNo: '2', treeLevel: '3', menuUrl: '/admin/system/plant' },
    { sysId: 'm10', menuCd: 'adminUser', menuNm: '관리자 관리', parentMenuCd: 'systemManagement', ordNo: '3', treeLevel: '3', menuUrl: '/admin/system/admin-user' },
    { sysId: 'm11', menuCd: 'menu', menuNm: '메뉴 관리', parentMenuCd: 'systemManagement', ordNo: '4', treeLevel: '3', menuUrl: '/admin/system/menu' },
    { sysId: 'm12', menuCd: 'message', menuNm: '메시지 관리', parentMenuCd: 'systemManagement', ordNo: '5', treeLevel: '3', menuUrl: '/admin/system/message' },
    { sysId: 'm13', menuCd: 'rule', menuNm: '규칙 관리', parentMenuCd: 'systemManagement', ordNo: '6', treeLevel: '3', menuUrl: '/admin/system/rule' },
    { sysId: 'm14', menuCd: 'paymentManagement', menuNm: '결제 관리', parentMenuCd: 'system', ordNo: '2', treeLevel: '2' },
    { sysId: 'm15', menuCd: 'paymentRate', menuNm: '결제 요금 관리', parentMenuCd: 'paymentManagement', ordNo: '1', treeLevel: '3', menuUrl: '/admin/payment/rate' },
    { sysId: 'm16', menuCd: 'plantStatus', menuNm: '사업장 상태 조회', parentMenuCd: 'paymentManagement', ordNo: '2', treeLevel: '3', menuUrl: '/admin/payment/plant-status' },
    { sysId: 'm17', menuCd: 'coupon', menuNm: '쿠폰 관리', parentMenuCd: 'paymentManagement', ordNo: '3', treeLevel: '3', menuUrl: '/admin/payment/coupon' },
    { sysId: 'm18', menuCd: 'logManagement', menuNm: '이력 관리', parentMenuCd: 'system', ordNo: '3', treeLevel: '2' },
    { sysId: 'm19', menuCd: 'accessLog', menuNm: '접속 정보 조회', parentMenuCd: 'logManagement', ordNo: '1', treeLevel: '3', menuUrl: '/admin/history/access-log' },
    { sysId: 'm20', menuCd: 'auditLog', menuNm: '변경 이력 조회', parentMenuCd: 'logManagement', ordNo: '2', treeLevel: '3', menuUrl: '/admin/history/audit-log' },
    { sysId: 'c1', menuCd: 'STO', menuNm: '매장', parentMenuCd: 'CLIENT', ordNo: '1', treeLevel: '1' },
    { sysId: 'c2', menuCd: 'STO_USR', menuNm: '유저 관리', parentMenuCd: 'STO', ordNo: '1', treeLevel: '2' },
    { sysId: 'c3', menuCd: 'STO_USR_MNG', menuNm: '유저 정보 관리', parentMenuCd: 'STO_USR', ordNo: '1', treeLevel: '3', menuUrl: '/client/store/user/management' },
    { sysId: 'c4', menuCd: 'STO_INFO', menuNm: '매장 정보 관리', parentMenuCd: 'STO', ordNo: '2', treeLevel: '2' },
    { sysId: 'c5', menuCd: 'STO_INFO_BASE', menuNm: '매장 기본 정보', parentMenuCd: 'STO_INFO', ordNo: '1', treeLevel: '3', menuUrl: '/client/store/info/base' },
    { sysId: 'c6', menuCd: 'STO_TBL', menuNm: '테이블 정보 관리', parentMenuCd: 'STO', ordNo: '3', treeLevel: '2' },
    { sysId: 'c7', menuCd: 'STO_TBL_MNG', menuNm: '테이블 관리', parentMenuCd: 'STO_TBL', ordNo: '1', treeLevel: '3', menuUrl: '/client/store/table/management' },
    { sysId: 'c8', menuCd: 'STO_TBL_QR', menuNm: 'QR 코드 관리', parentMenuCd: 'STO_TBL', ordNo: '2', treeLevel: '3', menuUrl: '/client/store/table/qr' },
    { sysId: 'c9', menuCd: 'STO_TBL_LAY', menuNm: '테이블 배치 관리', parentMenuCd: 'STO_TBL', ordNo: '3', treeLevel: '3', menuUrl: '/client/store/table/layout' },
    { sysId: 'c10', menuCd: 'MNU', menuNm: '메뉴', parentMenuCd: 'CLIENT', ordNo: '2', treeLevel: '1' },
    { sysId: 'c11', menuCd: 'MNU_INFO', menuNm: '메뉴 정보 관리', parentMenuCd: 'MNU', ordNo: '1', treeLevel: '2' },
    { sysId: 'c12', menuCd: 'MNU_INFO_MNG', menuNm: '메뉴 관리', parentMenuCd: 'MNU_INFO', ordNo: '1', treeLevel: '3', menuUrl: '/client/menu/info/management' },
    { sysId: 'c13', menuCd: 'MNU_INFO_OPT', menuNm: '옵션 관리', parentMenuCd: 'MNU_INFO', ordNo: '2', treeLevel: '3', menuUrl: '/client/menu/info/option' },
    { sysId: 'c14', menuCd: 'ORD', menuNm: '주문', parentMenuCd: 'CLIENT', ordNo: '3', treeLevel: '1' },
    { sysId: 'c15', menuCd: 'ORD_HIS', menuNm: '주문 이력', parentMenuCd: 'ORD', ordNo: '1', treeLevel: '2' },
    { sysId: 'c16', menuCd: 'ORD_HIS_LST', menuNm: '주문 이력 조회', parentMenuCd: 'ORD_HIS', ordNo: '1', treeLevel: '3', menuUrl: '/client/order/history/list' },
    { sysId: 'c17', menuCd: 'ORD_STT', menuNm: '주문 현황', parentMenuCd: 'ORD', ordNo: '2', treeLevel: '2' },
    { sysId: 'c18', menuCd: 'ORD_STT_MNG', menuNm: '주문 상태 관리', parentMenuCd: 'ORD_STT', ordNo: '1', treeLevel: '3', menuUrl: '/client/order/status/management' },
    { sysId: 'c19', menuCd: 'PAY', menuNm: '결제', parentMenuCd: 'CLIENT', ordNo: '4', treeLevel: '1' },
    { sysId: 'c20', menuCd: 'PAY_STT', menuNm: '결제 현황', parentMenuCd: 'PAY', ordNo: '1', treeLevel: '2' },
    { sysId: 'c21', menuCd: 'PAY_STT_LST', menuNm: '결제 목록 조회', parentMenuCd: 'PAY_STT', ordNo: '1', treeLevel: '3', menuUrl: '/client/payment/status/list' },
    { sysId: 'c22', menuCd: 'PAY_CAL', menuNm: '정산 관리', parentMenuCd: 'PAY', ordNo: '2', treeLevel: '2' },
    { sysId: 'c23', menuCd: 'PAY_CAL_LST', menuNm: '정산 조회', parentMenuCd: 'PAY_CAL', ordNo: '1', treeLevel: '3', menuUrl: '/client/payment/calculation/list' },
    { sysId: 'c24', menuCd: 'CBRD', menuNm: '게시판', parentMenuCd: 'CLIENT', ordNo: '5', treeLevel: '1' },
    { sysId: 'c25', menuCd: 'CBRD_NTC', menuNm: '공지사항', parentMenuCd: 'CBRD', ordNo: '1', treeLevel: '2' },
    { sysId: 'c26', menuCd: 'CBRD_NTC_LST', menuNm: '공지사항 조회', parentMenuCd: 'CBRD_NTC', ordNo: '1', treeLevel: '3', menuUrl: '/client/board/notice/list' },
    { sysId: 'c27', menuCd: 'CBRD_QNA', menuNm: '문의사항', parentMenuCd: 'CBRD', ordNo: '2', treeLevel: '2' },
    { sysId: 'c28', menuCd: 'CBRD_QNA_MNG', menuNm: '문의사항 관리', parentMenuCd: 'CBRD_QNA', ordNo: '1', treeLevel: '3', menuUrl: '/client/board/inquiry/management' },
  ]);
});

const noticeOverrideHandler = http.get(
  '*/api/system/settings/board/notice/search',
  ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const filtered = keyword
      ? NOTICE_MOCK_ROWS.filter(
          (row) =>
            row.noticeTitle?.toLowerCase().includes(keyword) ||
            row.noticeDescription?.toLowerCase().includes(keyword),
        )
      : NOTICE_MOCK_ROWS;
    return HttpResponse.json(filtered);
  },
);

const qnaOverrideHandler = http.get('*/api/system/settings/board/qna/search', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
  const filtered = keyword
    ? INQUIRY_MANAGE_MOCK_ROWS.filter(
        (row) =>
          row.qnaTitle?.toLowerCase().includes(keyword) ||
          row.qnaDescription?.toLowerCase().includes(keyword),
      )
    : INQUIRY_MANAGE_MOCK_ROWS;
  return HttpResponse.json(filtered);
});

const auditTrailOverrideHandler = http.get(
  '*/api/system/settings/log/audittrail',
  ({ request }) => {
    const url = new URL(request.url);
    const changeType = url.searchParams.get('changeType') ?? '';
    const auditFlag = CHANGE_TYPE_AUDIT_FLAG_MAP[changeType];
    const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
    const startMs = toMockDate(url.searchParams.get('startDate'));
    const endMs = toMockDate(url.searchParams.get('endDate'));

    const filtered = CHANGE_HISTORY_MOCK.filter((row) => {
      const rowMs = toMockDate(row.insertDatetime ?? '');
      const matchesChangeType = auditFlag ? row.auditFlag === auditFlag : true;
      const matchesKeyword = keyword
        ? row.menuNm?.toLowerCase().includes(keyword) ||
          row.auditTrailContents?.toLowerCase().includes(keyword)
        : true;
      const matchesStartDate = startMs !== null && rowMs !== null ? rowMs >= startMs : true;
      const matchesEndDate = endMs !== null && rowMs !== null ? rowMs <= endMs : true;

      return matchesChangeType && matchesKeyword && matchesStartDate && matchesEndDate;
    });

    return HttpResponse.json(filtered);
  },
);

const attachFileOverrideHandler = http.get('*/api/attach_file', ({ request }) => {
  const url = new URL(request.url);
  const linkSysId = url.searchParams.get('linkSysId');
  if (linkSysId === 'file-uuid-qna-1') {
    return HttpResponse.json([
      {
        sysId: 'attach-file-1',
        originalFileNm: '결제오류_스크린샷.png',
        fileSize: '204800',
        filePath: '/upload/qna/2026/03/screenshot.png',
        ordNo: 1,
        fileExt: 'png',
        pdfYn: 'N',
      },
      {
        sysId: 'attach-file-2',
        originalFileNm: '오류로그.pdf',
        fileSize: '1048576',
        filePath: '/upload/qna/2026/03/error-log.pdf',
        ordNo: 2,
        fileExt: 'pdf',
        pdfYn: 'Y',
      },
    ]);
  }
  if (linkSysId === 'file-uuid-notice-1') {
    return HttpResponse.json([
      {
        sysId: 'notice-attach-1',
        originalFileNm: '공지_본문.pdf',
        fileSize: '512000',
        filePath: '/upload/notice/2026/05/body.pdf',
        ordNo: 1,
        fileExt: 'pdf',
        pdfYn: 'Y',
      },
      {
        sysId: 'notice-attach-2',
        originalFileNm: '첨부_엑셀.xlsx',
        fileSize: '102400',
        filePath: '/upload/notice/2026/05/x.xlsx',
        ordNo: 2,
        fileExt: 'xlsx',
        pdfYn: 'N',
      },
    ]);
  }
  return HttpResponse.json([]);
});

const settingsHandlers = [
  getUpdateRuleMasterMockHandler(),
  getNewRuleMasterMockHandler(),
  getDelRuleMasterMockHandler(),
  getSaveRuleMockHandler(),
  getUpdatePlantMockHandler(),
  getNewPlantMockHandler(),
  getDelPlantMockHandler(),
  getSavePaymentCouponMockHandler(),
  getUpdatePaymentMockHandler(),
  getNewPaymentMockHandler(),
  getDelPaymentMockHandler(),
  getSaveMenuMockHandler(),
  getUpdateCommonMasterMockHandler(),
  getNewCommonMasterMockHandler(),
  getDelCommonMasterMockHandler(),
  getSaveCommonDetailMockHandler(),
  getGetRuleMasterMockHandler(),
  getGetRuleDetailMockHandler(),
  getGetPlantStatusMockHandler(),
  getSearchPlantMockHandler(),
  getGetPaymentCouponMockHandler(),
  getGetPaymentMockHandler(),
  getSearchCommonMockHandler(),
  getSearchCommonDetailMockHandler(),
  getUpdateQnaMockHandler(),
  getUpdateNoticeMockHandler(),
  getNewNoticeMockHandler(),
  getDelNoticeMockHandler(),
  getGetSysAccessLogMasterMockHandler(),
  getGetSysAccessLogDetailMockHandler(),
  getGetAuditTrailMockHandler(),
];

// auth 관련 핸들러(login / logout / me)는 test/handlers.js의 커스텀 로직을 유지한다.
// MSW는 첫 번째 매칭 핸들러를 사용하므로 authHandlers를 앞에 배치한다.
export const handlers = [
  ...authHandlers,
  paymentOverrideHandler,
  plantStatusOverrideHandler,
  couponOverrideHandler,
  adminUserOverrideHandler,
  adminUserSaveOverrideHandler,
  messageOverrideHandler,
  messageSaveOverrideHandler,
  clientUserOverrideHandler,
  paymentStatusMasterOverrideHandler,
  paymentStatusDetailOverrideHandler,
  settlementOverrideHandler,
  menuCategoryOverrideHandler,
  menuCategoryNewOverrideHandler,
  menuCategoryUpdateOverrideHandler,
  menuCategoryDeleteOverrideHandler,
  menuDetailOverrideHandler,
  menuDetailSaveOverrideHandler,
  menuOptionMasterOverrideHandler,
  menuOptionGroupOverrideHandler,
  menuOptionGroupNewOverrideHandler,
  menuOptionGroupUpdateOverrideHandler,
  menuOptionGroupDeleteOverrideHandler,
  menuOptionDetailOverrideHandler,
  menuOptionDetailSaveOverrideHandler,
  menuOverrideHandler,
  noticeOverrideHandler,
  qnaOverrideHandler,
  auditTrailOverrideHandler,
  attachFileOverrideHandler,
  ...settingsHandlers,
  ...getComboControllerMock(),
  ...getFileControllerMock(),
  ...getLogControllerMock(),
  ...getMainControllerMock(),
  ...getPopupControllerMock(),
  getResetPwdMockHandler(),
  getDelClientUserMockHandler(),
  getNewClientUserMockHandler(),
  getUpdateClientUserMockHandler(),
  storeInfoOverrideHandler,
  pwdChkOverrideHandler,
  getSaveStoreInfoMockHandler(),
  storeTableOverrideHandler,
  storeTableSaveOverrideHandler,
  qrCodeOverrideHandler,
  qrCodeSaveOverrideHandler,
];
