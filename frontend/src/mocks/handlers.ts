import { http, HttpResponse } from 'msw';
import { handlers as authHandlers } from '../test/handlers';
import { getSettingsControllerMock } from '../generated/settings-controller/settings-controller.msw';
import { getComboControllerMock } from '../generated/combo-controller/combo-controller.msw';
import { getFileControllerMock } from '../generated/file-controller/file-controller.msw';
import { getLogControllerMock } from '../generated/log-controller/log-controller.msw';
import { getMainControllerMock } from '../generated/main-controller/main-controller.msw';
import { getPopupControllerMock } from '../generated/popup-controller/popup-controller.msw';

// 사업장 조회 에러 확인용 — 확인 후 제거하거나 주석 처리
const plantSearchErrorHandler = http.get('*/api/system/settings/plant/search', () =>
  HttpResponse.json({ message: '서버 오류' }, { status: 500 }),
);

const devOverrideHandlers = [
  plantSearchErrorHandler,
];

// auth 관련 핸들러(login / logout / me)는 test/handlers.js의 커스텀 로직을 유지한다.
// MSW는 첫 번째 매칭 핸들러를 사용하므로 authHandlers를 앞에 배치한다.
export const handlers = [
  ...authHandlers,
  ...devOverrideHandlers,
  ...getSettingsControllerMock(),
  ...getComboControllerMock(),
  ...getFileControllerMock(),
  ...getLogControllerMock(),
  ...getMainControllerMock(),
  ...getPopupControllerMock(),
];