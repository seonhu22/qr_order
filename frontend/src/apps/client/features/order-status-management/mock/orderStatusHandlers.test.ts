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
    expect(changed.body[0]).toMatchObject({ rowType: 'MENU', unitPrice: 11900 });
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

  it('취소 요청은 사유와 상세 사유, 취소 시각을 저장한다', async () => {
    const response = await post('cancel_order', {
      header: { sysId: 'order-011' },
      cancelReason: 'OTHER',
      cancelDescription: '고객 요청',
    });
    expect(response.status).toBe(200);
    expect(getOrderStatusMockStore().find((row) => row.id === 'order-011')).toMatchObject({
      orderStatus: 'CANCELLED',
      paymentStatus: 'REFUNDED',
      cancelReason: 'OTHER',
      cancelDescription: '고객 요청',
    });
    expect(getOrderStatusMockStore().find((row) => row.id === 'order-011')?.cancelledAt).toBeTruthy();
  });

  it('취소 사유 GET은 header.sysId에 해당하는 주문 사유를 반환한다', async () => {
    const response = await fetch(`${API}/search/cancel_reason?header.sysId=order-002`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ cancelReason: 'CUSTOMER_REQUEST' });
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
