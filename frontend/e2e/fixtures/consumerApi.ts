import type { BrowserContext } from '@playwright/test';
import type {
  ConsumerMenuDetailEnvelope,
  ConsumerMenuMainEnvelope,
  ConsumerMenuItem,
  ConsumerOrderCreateRequest,
  ConsumerSessionEnvelope,
} from '../../src/generated/types';

// Independent generated API contracts, not the application's MSW handlers.
const menu: ConsumerMenuItem = {
  menuSysId: '01M6N2PY9X1MKCETDXVZXD11AJ',
  categorySysId: 'category-e2e',
  categoryName: '식사',
  menuName: '브라우저 테스트 된장찌개',
  menuPrice: 8_000,
  menuDescription: '브라우저 회귀 테스트 전용 메뉴',
  optionUseYn: 'N',
  soldOutYn: 'N',
};
const session: ConsumerSessionEnvelope = {
  success: true,
  data: {
    consumerSessionId: 'visit-browser-e2e',
    status: 'ACTIVE',
    sysPlantCd: 'E2E',
    storeName: '브라우저 테스트 매장',
    tableSysId: 'table-browser-e2e',
    tableName: '테스트 1',
    tableNum: 1,
    tableQty: 4,
    orderingAllowed: true,
    orderingBlockedReason: null,
    startedAt: '2026-11-10 12:00:00',
  },
};
const main: ConsumerMenuMainEnvelope = {
  success: true,
  data: {
    storeName: '브라우저 테스트 매장',
    tableNum: 1,
    header: { categoryList: [{ categorySysId: menu.categorySysId, categoryName: '식사' }] },
    body: { menuList: [menu] },
  },
};
const detail: ConsumerMenuDetailEnvelope = {
  success: true,
  data: { body: { ...menu, optionGroupList: [] } },
};

export const consumerMenuName = menu.menuName;
export const consumerMenuId = menu.menuSysId;

export async function installConsumerApi(context: BrowserContext, failFirstOrder = false, orderNo = '9001') {
  const unexpectedRequests: string[] = [];
  const orderRequests: ConsumerOrderCreateRequest[] = [];
  let ordered = false;
  await context.route((url) => url.pathname.startsWith('/api/'), async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (method === 'GET' && path === '/api/auth/me') {
      // Root AuthProvider also initializes on unauthenticated Consumer pages.
      await route.fulfill({ status: 401, json: { success: false, data: null, message: '로그인이 필요합니다.' } });
    } else if (method === 'GET' && path === '/api/client/consumer/session') {
      await route.fulfill({ json: session });
    } else if (method === 'GET' && path === '/api/client/consumer/menu/main') {
      await route.fulfill({ json: main });
    } else if (method === 'GET' && path === `/api/client/consumer/menu/${menu.menuSysId}`) {
      await route.fulfill({ json: detail });
    } else if (method === 'GET' && path === '/api/client/consumer/orders') {
      await route.fulfill({ json: { success: true, data: { orders: ordered ? [{
        orderId: '01M6N2PY8X87E9C3MVSA20MKVX', orderNo, status: 'RECEIVED',
        totalAmount: 8_000, itemCount: 1, orderedAt: '2026-11-10 12:01:00',
      }] : [] } } });
    } else if (method === 'POST' && path === '/api/client/consumer/orders') {
      orderRequests.push(request.postDataJSON() as ConsumerOrderCreateRequest);
      if (failFirstOrder && orderRequests.length === 1) {
        await route.fulfill({ status: 500, json: { success: false, message: '일시적인 테스트 오류' } });
        return;
      }
      ordered = true;
      await route.fulfill({ status: 201, json: { success: true, data: {
        orderId: '01M6N2PY8X87E9C3MVSA20MKVX', orderNo, status: 'RECEIVED',
        totalAmount: 8_000, orderedAt: '2026-11-10 12:01:00',
      } } });
    } else if (method === 'GET' && path === '/api/client/consumer/events') {
      await route.fulfill({ contentType: 'text/event-stream', body: 'event: connect\ndata: connected\n\n' });
    } else {
      unexpectedRequests.push(`${method} ${path}`);
      await route.fulfill({ status: 501, json: { success: false, message: '등록되지 않은 브라우저 테스트 API' } });
    }
  });
  return { unexpectedRequests, orderRequests };
}
