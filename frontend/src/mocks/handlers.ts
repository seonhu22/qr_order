import { http, HttpResponse } from 'msw';
import { handlers as authHandlers } from '../test/handlers';
import { INQUIRY_MANAGE_MOCK_ROWS } from '../apps/admin/features/inquiry-manage/mock/inquiryManageMock';
import { NOTICE_MOCK_ROWS } from '../apps/admin/features/notice-manage/mock/noticeManageMock';
import {
  getDelCommonMasterMockHandler,
  getDelPaymentMockHandler,
  getDelPlantMockHandler,
  getDelRuleMasterMockHandler,
  getGetAdminUserMockHandler,
  getGetMessageMockHandler,
  getGetPaymentCouponMockHandler,
  getGetPaymentMockHandler,
  getGetPlantStatusMockHandler,
  getGetRuleDetailMockHandler,
  getGetRuleMasterMockHandler,
  getNewCommonMasterMockHandler,
  getNewPaymentMockHandler,
  getNewPlantMockHandler,
  getNewRuleMasterMockHandler,
  getSaveAdminUserMockHandler,
  getSaveCommonDetailMockHandler,
  getSaveMenuMockHandler,
  getSaveMessageMockHandler,
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
import { PAYMENT_MOCK_ROWS } from '../apps/admin/features/payment-manage/mock/paymentManageMock';
import { PLANT_STATUS_MOCK_ROWS } from '../apps/admin/features/plant-status/mock/plantStatusMock';
import { COUPON_MOCK_ROWS } from '../apps/admin/features/coupon-manage/mock/couponManageMock';

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

const menuOverrideHandler = http.get('*/api/system/settings/menu/search', () => {
  return HttpResponse.json([
    { sysId: 'm6', menuCd: 'system', menuNm: '시스템', parentMenuCd: '', ordNo: '1', treeLevel: '1' },
    { sysId: 'm1', menuCd: 'board', menuNm: '게시판', parentMenuCd: '', ordNo: '2', treeLevel: '1' },
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
  getSaveMessageMockHandler(),
  getSaveMenuMockHandler(),
  getUpdateCommonMasterMockHandler(),
  getNewCommonMasterMockHandler(),
  getDelCommonMasterMockHandler(),
  getSaveCommonDetailMockHandler(),
  getSaveAdminUserMockHandler(),
  getGetRuleMasterMockHandler(),
  getGetRuleDetailMockHandler(),
  getGetPlantStatusMockHandler(),
  getSearchPlantMockHandler(),
  getGetPaymentCouponMockHandler(),
  getGetPaymentMockHandler(),
  getGetMessageMockHandler(),
  getSearchCommonMockHandler(),
  getSearchCommonDetailMockHandler(),
  getGetAdminUserMockHandler(),
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
  menuOverrideHandler,
  noticeOverrideHandler,
  qnaOverrideHandler,
  attachFileOverrideHandler,
  ...settingsHandlers,
  ...getComboControllerMock(),
  ...getFileControllerMock(),
  ...getLogControllerMock(),
  ...getMainControllerMock(),
  ...getPopupControllerMock(),
];
