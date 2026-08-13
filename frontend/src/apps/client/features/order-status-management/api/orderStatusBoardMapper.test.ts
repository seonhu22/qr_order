import { describe, expect, it } from 'vitest';
import { mapStatusResponsesToOrderBoardRows } from './orderStatusBoardMapper';

describe('mapStatusResponsesToOrderBoardRows', () => {
  it('서버 계산 금액을 총액과 화면 편집용 단가로 변환한다', () => {
    const result = mapStatusResponsesToOrderBoardRows([
      {
        statusFlag: '01',
        statusList: [{
          orderNum: 7,
          header: {
            sysId: 'order-7',
            tableNum: 3,
            orderDatetime: '14:25',
            paymentStatus: 'PENDING',
            cancelledAt: '2026-08-04T14:30:00',
            statusChangedAt: '2026-08-04T14:29:00.000Z',
          },
          body: [
            { rowType: 'OPTION', detailSysId: 'option-1', parentDetailSysId: 'menu-1', itemName: '곱빼기', qty: 1, price: 1000 },
            { rowType: 'MENU', detailSysId: 'menu-1', itemName: '쌀국수', qty: 2, price: 23800 },
          ],
          footer: { sysId: 'order-7', totalPrice: 24800 },
        }],
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'order-7',
      orderNo: '0007',
      tableNum: '3',
      orderStatus: 'RECEIVED',
      cancelledAt: '2026-08-04T14:30:00',
      statusChangedAt: '2026-08-04T14:29:00.000Z',
      totalPrice: 24800,
      menuItems: [{
        id: 'menu-1',
        name: '쌀국수',
        quantity: 2,
        unitPrice: 11900,
        options: [{ id: 'option-1', name: '곱빼기', quantity: 1, unitPrice: 1000 }],
      }],
    });
    expect(result[0].orderDatetime).toMatch(/^\d{4}-\d{2}-\d{2}T14:25:00$/);
  });

  it('취소 시각은 공백 형식을 ISO 형태로 정규화하고 누락 금액은 0을 사용한다', () => {
    const [row] = mapStatusResponsesToOrderBoardRows([{
      statusFlag: '99!',
      statusList: [{
        header: {
          sysId: 'order-1',
          tableInfo: '5',
          orderDatetime: '2026-08-04 12:00:00',
          cancelDatetime: '2026-08-04 12:30:00',
        },
        body: [{ rowType: 'MENU', detailSysId: 'menu-1', itemName: '메뉴', qty: 1 }],
      }],
    }]);

    expect(row.orderDatetime).toBe('2026-08-04T12:00:00');
    expect(row.cancelledAt).toBe('2026-08-04T12:30:00');
    expect(row.menuItems[0].unitPrice).toBe(0);
  });

  it('식별자나 상태를 해석할 수 없는 항목은 제외하고 누락 배열은 허용한다', () => {
    expect(mapStatusResponsesToOrderBoardRows()).toEqual([]);
    expect(mapStatusResponsesToOrderBoardRows([
      { statusFlag: '01', statusList: [{ header: {} }] },
      { statusFlag: 'UNKNOWN', statusList: [{ header: { sysId: 'order-1' } }] },
    ])).toEqual([]);
  });
});
