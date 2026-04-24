import { http, HttpResponse } from 'msw';
import { handlers as authHandlers } from '../test/handlers';
import { getSettingsControllerMock } from '../generated/settings-controller/settings-controller.msw';
import { getComboControllerMock } from '../generated/combo-controller/combo-controller.msw';
import { getFileControllerMock } from '../generated/file-controller/file-controller.msw';
import { getLogControllerMock } from '../generated/log-controller/log-controller.msw';
import { getMainControllerMock } from '../generated/main-controller/main-controller.msw';
import { getPopupControllerMock } from '../generated/popup-controller/popup-controller.msw';
import { PAYMENT_MOCK_ROWS } from '../apps/admin/features/payment-manage/mock/paymentManageMock';
import { PLANT_STATUS_MOCK_ROWS } from '../apps/admin/features/plant-status/mock/plantStatusMock';
import { COUPON_MOCK_ROWS } from '../apps/admin/features/coupon-manage/mock/couponManageMock';
import { CHANGE_HISTORY_MOCK } from '../apps/admin/features/change-history/mock/changeHistoryMock';
import { NOTICE_MOCK_ROWS } from '../apps/admin/features/notice-manage/mock/noticeManageMock';
import { INQUIRY_MANAGE_MOCK_ROWS } from '../apps/admin/features/inquiry-manage/mock/inquiryManageMock';

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

const plantStatusOverrideHandler = http.get('*/api/system/settings/plant_status/search', ({ request }) => {
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
});

const couponOverrideHandler = http.get('*/api/system/settings/payment_coupon/search', ({ request }) => {
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
});

const noticeOverrideHandler = http.get('*/api/system/settings/board/notice/search', ({ request }) => {
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
});

const inquiryOverrideHandler = http.get('*/api/system/settings/board/qna/search', ({ request }) => {
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

const changeHistoryOverrideHandler = http.get('*/api/system/settings/log/audittrail', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('searchKeyword')?.toLowerCase() ?? '';
  const filtered = keyword
    ? CHANGE_HISTORY_MOCK.filter(
        (row) =>
          row.menuNm?.toLowerCase().includes(keyword) ||
          row.auditTrailContents?.toLowerCase().includes(keyword),
      )
    : CHANGE_HISTORY_MOCK;
  return HttpResponse.json(filtered);
});

const settingsHandlers = getSettingsControllerMock().filter((handler) => {
  const path = String((handler as { info?: { path?: string } }).info?.path ?? '');

  return (
    path !== '*/api/system/settings/log/login/master' &&
    path !== '*/api/system/settings/log/login/detail'
  );
});

// auth 관련 핸들러(login / logout / me)는 test/handlers.js의 커스텀 로직을 유지한다.
// MSW는 첫 번째 매칭 핸들러를 사용하므로 authHandlers를 앞에 배치한다.
export const handlers = [
  ...authHandlers,
  paymentOverrideHandler,
  plantStatusOverrideHandler,
  couponOverrideHandler,
  noticeOverrideHandler,
  inquiryOverrideHandler,
  changeHistoryOverrideHandler,
  ...settingsHandlers,
  ...getComboControllerMock(),
  ...getFileControllerMock(),
  ...getLogControllerMock(),
  ...getMainControllerMock(),
  ...getPopupControllerMock(),
];
