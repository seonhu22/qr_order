import type { OrderHistoryRow } from '../types';

/** `dev:mock`의 주문이력 API 응답에만 사용하는 개발 데이터. 운영 쿼리는 이 배열을 직접 참조하지 않는다. */
function orderDatetimeDaysAgo(daysAgo: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:00`;
}

const MOCK_SEEDS: Array<
  Pick<OrderHistoryRow, 'tableNum' | 'orderStatus' | 'paymentStatus'> & {
    daysAgo: number;
    hour: number;
    minute: number;
  }
> = [
  { daysAgo: 0, hour: 0, minute: 0, tableNum: '1', orderStatus: 'SERVED', paymentStatus: 'PAID' },
  { daysAgo: 1, hour: 19, minute: 32, tableNum: '3', orderStatus: 'COOKING', paymentStatus: 'PAID' },
  { daysAgo: 1, hour: 19, minute: 10, tableNum: '5', orderStatus: 'RECEIVED', paymentStatus: 'PENDING' },
  { daysAgo: 4, hour: 13, minute: 45, tableNum: '2', orderStatus: 'CANCELLED', paymentStatus: 'REFUNDED' },
  { daysAgo: 6, hour: 18, minute: 20, tableNum: '4', orderStatus: 'SERVED', paymentStatus: 'PAID' },
];

export const ORDER_HISTORY_MOCK: OrderHistoryRow[] = MOCK_SEEDS.map((seed, index) => {
  const orderDatetime = orderDatetimeDaysAgo(seed.daysAgo, seed.hour, seed.minute);
  const orderNo = `ORD-${orderDatetime.slice(0, 10).replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`;

  return {
    id: `order-${String(index + 1).padStart(3, '0')}`,
    orderNo,
    tableNum: seed.tableNum,
    orderStatus: seed.orderStatus,
    paymentStatus: seed.paymentStatus,
    orderDatetime,
  };
});
