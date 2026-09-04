import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { server } from '@/test/server';
import {
  getOrderStatusMockStore,
  orderStatusHandlers,
  resetOrderStatusMockStore,
} from './orderStatusHandlers';

const API = 'http://localhost/api/client/order_manage/status';

async function post(path: string, body: unknown) {
  return fetch(`${API}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('orderStatusHandlers', () => {
  beforeEach(() => {
    resetOrderStatusMockStore();
    server.use(...orderStatusHandlers);
  });

  afterEach(() => {
    resetOrderStatusMockStore();
  });

  it('조리 시작 POST 뒤 GET은 변경된 서버 상태와 가격을 반환한다', async () => {
    const response = await post('go_to_cooking', { header: { sysId: 'order-010' } });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });

    expect(getOrderStatusMockStore().find((row) => row.id === 'order-010')?.orderStatus).toBe('COOKING');

    const search = await fetch(`${API}/search`);
    const groups = await search.json();
    const cooking = groups.find((group: { statusFlag: string }) => group.statusFlag === '02');
    const changed = cooking.statusList.find((item: { header: { sysId: string } }) => item.header.sysId === 'order-010');
    expect(changed.body[0]).toMatchObject({ rowType: 'MENU', price: 23800 });
    expect(changed.footer).toMatchObject({ totalPrice: 42700 });
    expect(changed.header.statusChangedAt).toBeTruthy();
  });

  it.each([
    ['go_to_serving_complete', 'order-009', 'SERVED'],
    ['back_to_receive_order', 'order-009', 'RECEIVED'],
    ['back_to_cooking', 'order-004', 'COOKING'],
  ])('%s가 저장소 상태를 %s로 바꾼다', async (path, id, expected) => {
    const response = await post(path, { header: { sysId: id } });
    expect(response.status).toBe(200);
    expect(getOrderStatusMockStore().find((row) => row.id === id)?.orderStatus).toBe(expected);
  });

  it('취소 요청은 유형과 기타 사유, 취소 시각을 저장한다', async () => {
    const response = await post('cancel_order', {
      header: { sysId: 'order-011' },
      cancelType: 'OTHER',
      cancelReason: '고객 요청',
    });
    expect(response.status).toBe(200);
    expect(getOrderStatusMockStore().find((row) => row.id === 'order-011')).toMatchObject({
      orderStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      cancelType: 'OTHER',
      cancelReason: '고객 요청',
    });
    expect(getOrderStatusMockStore().find((row) => row.id === 'order-011')?.cancelledAt).toBeTruthy();
  });

  it('취소 사유 GET은 sysId에 해당하는 주문 사유를 반환한다', async () => {
    const response = await fetch(`${API}/search/cancel_reason?sysId=order-002`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ cancelType: 'CUSTOMER_REQUEST' });
  });

  it('결제완료는 조회한 마스터 기준으로 현재 테이블 방문 주문을 제거한다', async () => {
    const payment = await fetch(`${API}/get_payment_complete?sysId=order-004`);
    expect(payment.status).toBe(200);
    const paymentBody = await payment.json();

    const response = await post('payment_complete', {
      paymentType: '카드',
      header: paymentBody.header,
    });

    expect(response.status).toBe(200);
    expect(getOrderStatusMockStore().filter((row) => row.tableNum === '5' && row.orderStatus !== 'CANCELLED'))
      .toHaveLength(0);
  });

  it('미결제도 현재 테이블 방문의 모든 주문을 제거한다', async () => {
    const payment = await fetch(`${API}/get_payment_complete?sysId=order-003`);
    const paymentBody = await payment.json();

    const response = await post('not_payment_complete', {
      orderInfo: paymentBody.header,
      unpaidReason: 'CUSTOMER_ABSENT',
      unpaidDescription: '',
    });

    expect(response.status).toBe(200);
    expect(getOrderStatusMockStore().filter((row) => row.tableNum === '2' && row.orderStatus !== 'CANCELLED'))
      .toHaveLength(0);
  });

  it('식별자 누락, 없는 주문, 잘못된 상태 전환을 거부한다', async () => {
    expect((await post('go_to_cooking', {})).status).toBe(400);
    expect((await post('go_to_cooking', { header: { sysId: 'missing' } })).status).toBe(404);
    expect((await post('go_to_cooking', { header: { sysId: 'order-009' } })).status).toBe(409);
  });

  it('미등록 주문 API를 실제 서버로 우회시키지 않는다', async () => {
    const response = await post('unknown_action', { header: { sysId: 'order-010' } });
    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });

  it('reset하면 이전 테스트의 mutation 결과가 남지 않는다', async () => {
    await post('go_to_cooking', { header: { sysId: 'order-010' } });
    resetOrderStatusMockStore();
    expect(getOrderStatusMockStore().find((row) => row.id === 'order-010')?.orderStatus).toBe('RECEIVED');
  });
});
