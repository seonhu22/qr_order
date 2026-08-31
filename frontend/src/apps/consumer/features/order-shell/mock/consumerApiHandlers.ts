import { http, HttpResponse } from 'msw';
import type {
  ConsumerOrderCreateRequest,
  ConsumerOrderDetailResponse,
  ConsumerSessionEnvelope,
} from '@/generated/types';

const sessionResponse: ConsumerSessionEnvelope = {
  success: true,
  data: {
    consumerSessionId: 'visit-001',
    status: 'ACTIVE',
    sysPlantCd: 'ADMIN',
    storeName: 'QR 오더 테스트 매장',
    tableSysId: 'table-003',
    tableName: '내부 1번',
    tableNum: 3,
    tableQty: 4,
    orderingAllowed: true,
    orderingBlockedReason: null,
    startedAt: '2026-09-01 09:00:00',
  },
};

let orders: ConsumerOrderDetailResponse[] = [];

export function resetConsumerApiMockState() {
  orders = [];
}

export const consumerApiHandlers = [
  http.get('*/api/client/consumer/session', () => HttpResponse.json(sessionResponse)),
  http.get('*/api/client/consumer/orders', () =>
    HttpResponse.json({
      success: true,
      data: {
        orders: orders.map((order) => ({
          orderId: order.orderId,
          orderNo: order.orderNo,
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
          orderedAt: order.orderedAt,
          updatedAt: order.updatedAt,
        })),
      },
    }),
  ),
  http.post('*/api/client/consumer/orders', async ({ request }) => {
    const body = (await request.json()) as ConsumerOrderCreateRequest;
    const now = new Date().toISOString();
    const orderId = `order-${orders.length + 1}`;
    const totalAmount = body.items.reduce((sum, item) => sum + item.quantity * 10_000, 0);
    orders = [
      {
        orderId,
        orderNo: String(orders.length + 1).padStart(4, '0'),
        status: 'RECEIVED',
        totalAmount,
        orderedAt: now,
        updatedAt: now,
        items: body.items.map((item, index) => ({
          orderItemId: `${orderId}-item-${index + 1}`,
          menuSysId: item.menuSysId,
          menuName: `메뉴 ${index + 1}`,
          quantity: item.quantity,
          unitAmount: 10_000,
          lineAmount: item.quantity * 10_000,
          options: (item.options ?? []).map((option) => ({
            optionSysId: option.optionSysId,
            optionName: '선택 옵션',
            quantity: option.quantity,
            unitAmount: 0,
            lineAmount: 0,
          })),
        })),
      },
      ...orders,
    ];
    return HttpResponse.json({
      success: true,
      data: { orderId, orderNo: '0001', status: 'RECEIVED', totalAmount, orderedAt: now },
    });
  }),
  http.get('*/api/client/consumer/orders/:orderId', ({ params }) => {
    const order = orders.find((candidate) => candidate.orderId === params.orderId);
    if (!order) {
      return HttpResponse.json({ success: false, message: '주문이 없습니다.' }, { status: 404 });
    }
    return HttpResponse.json({ success: true, data: order });
  }),
];
