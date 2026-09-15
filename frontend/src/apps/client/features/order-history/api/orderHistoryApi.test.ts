import { describe, expect, it } from 'vitest';
import {
  mapToOrderHistoryRows,
  mapToOrderHistoryRow,
  toOrderHistoryQueryParams,
} from './orderHistoryApi';

describe('toOrderHistoryQueryParams', () => {
  it('날짜는 API의 LocalDate 형식으로, 화면 상태는 서버 코드로 변환한다', () => {
    expect(
      toOrderHistoryQueryParams({
        startDate: '2026-08-01 00:00:00',
        endDate: '2026-08-06 23:59:59',
        searchKeyword: ' 9009 ',
        orderStatus: 'COOKING',
      }),
    ).toEqual({
      startDate: '2026-08-01',
      endDate: '2026-08-06',
      searchKeyword: '9009',
      orderStatus: '02',
    });
  });

  it('전체 조회에서는 빈 선택 조건을 요청에서 제외한다', () => {
    expect(
      toOrderHistoryQueryParams({
        startDate: '2026-08-01 00:00:00',
        endDate: '2026-08-06 23:59:59',
        searchKeyword: '   ',
        orderStatus: '',
      }),
    ).toEqual({ startDate: '2026-08-01', endDate: '2026-08-06' });
  });
});

describe('mapToOrderHistoryRow', () => {
  it('백엔드 주문·결제 코드와 필드명을 화면 모델로 변환한다', () => {
    expect(
      mapToOrderHistoryRow({
        sysId: 'order-9009',
        orderNo: '9009',
        tableNum: '3',
        orderStatus: '99!',
        paymentStatus: 'N',
        orderStartDatetime: '2026-08-06 14:25:00',
      }),
    ).toEqual({
      id: 'order-9009',
      orderNo: '9009',
      tableNum: '3',
      orderStatus: 'CANCELLED',
      paymentStatus: 'UNPAID',
      orderDatetime: '2026-08-06 14:25:00',
    });
  });

  it('목록이 없으면 빈 배열을 반환한다', () => {
    expect(mapToOrderHistoryRows({})).toEqual([]);
  });
});
