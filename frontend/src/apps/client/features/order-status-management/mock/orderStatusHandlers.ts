import { http, HttpResponse, type HttpHandler } from 'msw';
import type { StatusRequest } from '@/generated/types/statusRequest';
import type { OrderBoardRow, OrderBoardStatus } from '../types';
import { toApiOrderStatus } from '../api/statusCodeMapper';
import type { OrderStatusCompatibleResponse } from '../api/orderStatusBoardMapper';
import { ORDER_STATUS_BOARD_MOCK } from './orderStatusBoardMock';
import { calculateMenuItemTotal } from '../utils';

const ORDER_STATUS_API_PATTERN = '*/api/client/order_manage/status/*';
const ORDER_STATUS_SEARCH_PATTERN = '*/api/client/order_manage/status/search';
const PAYMENT_MASTER_PREFIX = 'mock-payment-master-';

let rows = createOrderStatusMockStore();
let lastTransitionAtMs = 0;

export function createOrderStatusMockStore(seed: OrderBoardRow[] = ORDER_STATUS_BOARD_MOCK): OrderBoardRow[] {
  return structuredClone(seed);
}

export function resetOrderStatusMockStore(): void {
  rows = createOrderStatusMockStore();
  lastTransitionAtMs = 0;
}

export function getOrderStatusMockStore(): OrderBoardRow[] {
  return structuredClone(rows);
}

function toStatusResponses(source: OrderBoardRow[]): OrderStatusCompatibleResponse[] {
  const grouped = new Map<OrderBoardStatus, OrderBoardRow[]>();
  source.forEach((row) => grouped.set(row.orderStatus, [...(grouped.get(row.orderStatus) ?? []), row]));

  return [...grouped].map(([status, statusRows]) => ({
    statusFlag: toApiOrderStatus(status),
    statusList: statusRows.map((row) => ({
      orderNum: Number(row.orderNo),
      header: {
        sysId: row.id,
        orderNum: Number(row.orderNo),
        tableInfo: row.tableNum,
        tableNum: Number(row.tableNum),
        orderDatetime: row.orderDatetime,
        orderStatus: toApiOrderStatus(row.orderStatus),
        paymentStatus: row.paymentStatus,
        cancelledAt: row.cancelledAt,
        statusChangedAt: row.statusChangedAt,
      },
      body: row.menuItems.flatMap((menu) => [
        {
          linkSysId: row.id,
          rowType: 'MENU',
          detailSysId: menu.id,
          itemName: menu.name,
          qty: menu.quantity,
          paymentYn: row.paymentStatus === 'PAID' ? 'N' : 'Y',
          price: menu.unitPrice * menu.quantity,
        },
        ...menu.options.map((option) => ({
          linkSysId: row.id,
          rowType: 'OPTION',
          detailSysId: option.id,
          parentDetailSysId: menu.id,
          itemName: option.name,
          qty: option.quantity,
          paymentYn: 'Y',
          price: option.unitPrice * option.quantity,
        })),
      ]),
      footer: {
        sysId: row.id,
        totalPrice: row.menuItems.reduce((sum, menu) => sum + calculateMenuItemTotal(menu), 0),
      },
    })),
  }));
}

function failure(message: string, status = 400) {
  return HttpResponse.json({ success: false, message }, { status });
}

function transitionHandler(path: string, from: OrderBoardStatus[], to: OrderBoardStatus): HttpHandler {
  return http.post(`*/api/client/order_manage/status/${path}`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as StatusRequest | null;
    const id = body?.header?.sysId;
    if (!id) return failure('주문 식별자가 필요합니다.');

    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return failure('주문을 찾을 수 없습니다.', 404);
    if (!from.includes(rows[index].orderStatus)) return failure('허용되지 않은 주문 상태 변경입니다.', 409);

    lastTransitionAtMs = Math.max(Date.now(), lastTransitionAtMs + 1);
    rows[index] = {
      ...rows[index],
      orderStatus: to,
      statusChangedAt: new Date(lastTransitionAtMs).toISOString(),
      ...(to === 'CANCELLED'
        ? {
            paymentStatus: 'REFUNDED' as const,
            cancelledAt: new Date().toISOString().slice(0, 19),
            cancelType: body?.cancelType,
            cancelReason: body?.cancelReason,
            cancelDescription: body?.cancelDescription,
          }
        : {}),
    };
    return HttpResponse.json({ success: true, message: '주문 상태가 변경되었습니다.' });
  });
}

function paymentMasterId(tableNum: string): string {
  return `${PAYMENT_MASTER_PREFIX}${tableNum}`;
}

function tableNumFromPaymentMaster(id?: string): string | undefined {
  return id?.startsWith(PAYMENT_MASTER_PREFIX) ? id.slice(PAYMENT_MASTER_PREFIX.length) : undefined;
}

function completeTableVisit(tableNum: string, requireAllServed = false): 'COMPLETED' | 'MISSING' | 'NOT_READY' {
  const targets = rows.filter((row) => row.tableNum === tableNum && row.orderStatus !== 'CANCELLED');
  if (targets.length === 0) return 'MISSING';
  if (requireAllServed && targets.some((row) => row.orderStatus !== 'SERVED')) return 'NOT_READY';
  rows = rows.filter((row) => row.tableNum !== tableNum || row.orderStatus === 'CANCELLED');
  return 'COMPLETED';
}

export const orderStatusHandlers: HttpHandler[] = [
  http.get(ORDER_STATUS_SEARCH_PATTERN, () => HttpResponse.json(toStatusResponses(rows))),
  http.get('*/api/client/order_manage/status/search/cancel_reason', ({ request }) => {
    const id = new URL(request.url).searchParams.get('sysId');
    if (!id) return failure('주문 식별자가 필요합니다.');
    const row = rows.find((item) => item.id === id);
    if (!row) return failure('주문을 찾을 수 없습니다.', 404);
    return HttpResponse.json({
      cancelType: row.cancelType,
      cancelReason: row.cancelReason,
      cancelDescription: row.cancelDescription,
      cancelDatetime: row.cancelledAt?.replace('T', ' '),
    });
  }),
  http.get('*/api/client/order_manage/status/get_payment_complete', ({ request }) => {
    const id = new URL(request.url).searchParams.get('sysId');
    const row = rows.find((item) => item.id === id);
    if (!row) return failure('결제 대상 주문을 찾을 수 없습니다.', 404);
    return HttpResponse.json({
      header: {
        sysId: paymentMasterId(row.tableNum),
        tableInfo: row.tableNum,
        orderDatetime: row.orderDatetime.replace('T', ' '),
      },
      body: [],
      footer: { sysId: row.id, totalPrice: row.totalPrice ?? 0 },
    });
  }),
  http.post('*/api/client/order_manage/status/payment_complete', async ({ request }) => {
    const body = await request.json().catch(() => null) as {
      paymentType?: string;
      header?: { sysId?: string };
    } | null;
    if (body?.paymentType !== '카드' && body?.paymentType !== '현금') {
      return failure('지원하지 않는 결제수단입니다.');
    }
    const tableNum = tableNumFromPaymentMaster(body.header?.sysId);
    if (!tableNum) {
      return failure('결제 대상 주문을 찾을 수 없습니다.', 404);
    }
    const result = completeTableVisit(tableNum, true);
    if (result === 'MISSING') return failure('결제 대상 주문을 찾을 수 없습니다.', 404);
    if (result === 'NOT_READY') return failure('모든 주문의 서빙이 완료된 후 결제할 수 있습니다.', 409);
    return HttpResponse.json({ success: true, message: '결제완료.' });
  }),
  http.post('*/api/client/order_manage/status/not_payment_complete', async ({ request }) => {
    const body = await request.json().catch(() => null) as { orderInfo?: { sysId?: string } } | null;
    const tableNum = tableNumFromPaymentMaster(body?.orderInfo?.sysId);
    if (!tableNum || completeTableVisit(tableNum) === 'MISSING') {
      return failure('결제 대상 주문을 찾을 수 없습니다.', 404);
    }
    return HttpResponse.json({ success: true, message: '미결제완료.' });
  }),
  transitionHandler('go_to_cooking', ['RECEIVED'], 'COOKING'),
  transitionHandler('go_to_serving_complete', ['COOKING'], 'SERVED'),
  transitionHandler('back_to_receive_order', ['COOKING'], 'RECEIVED'),
  transitionHandler('back_to_cooking', ['SERVED'], 'COOKING'),
  transitionHandler('cancel_order', ['RECEIVED', 'COOKING', 'SERVED'], 'CANCELLED'),
  http.all(ORDER_STATUS_API_PATTERN, ({ request }) =>
    failure(`Mock에 등록되지 않은 주문 API입니다: ${request.method}`, 501),
  ),
];
