import type { DailySale } from '@/generated/types/dailySale';
import type { SettlementResponse } from '@/generated/types/settlementResponse';

/**
 * orval이 생성한 MSW 핸들러는 faker로 각 필드를 독립적인 무작위 숫자로 채워
 * "순매출 = 총결제 - 취소 - 할인" 같은 화면의 집계 공식이 깨져 보인다.
 * 이 mock은 일별 합계가 상위 집계와 실제로 맞도록 큐레이션한다.
 *
 * `dailySales`에는 할인 필드가 없어(스키마상 일별 할인액을 추적하지 않음) `dayNetPrice`는
 * `dayTotalPrice - dayCancelPrice`로만 계산하고, 상위 `netPrice`만 `discountPice`를 추가로 반영한다.
 */
export const SETTLEMENT_DAILY_SALES_MOCK: DailySale[] = [
  { groupDate: '2026-06-17', dayTotalPrice: 420000, dayCancelPrice: 0, dayNetPrice: 420000, dayOrderCount: 18, dayCancelCount: 0 },
  { groupDate: '2026-06-18', dayTotalPrice: 385000, dayCancelPrice: 25000, dayNetPrice: 360000, dayOrderCount: 15, dayCancelCount: 1 },
  { groupDate: '2026-06-19', dayTotalPrice: 510000, dayCancelPrice: 0, dayNetPrice: 510000, dayOrderCount: 21, dayCancelCount: 0 },
  { groupDate: '2026-06-20', dayTotalPrice: 460000, dayCancelPrice: 40000, dayNetPrice: 420000, dayOrderCount: 19, dayCancelCount: 2 },
  { groupDate: '2026-06-21', dayTotalPrice: 530000, dayCancelPrice: 0, dayNetPrice: 530000, dayOrderCount: 22, dayCancelCount: 0 },
  { groupDate: '2026-06-22', dayTotalPrice: 610000, dayCancelPrice: 30000, dayNetPrice: 580000, dayOrderCount: 25, dayCancelCount: 1 },
  { groupDate: '2026-06-23', dayTotalPrice: 480000, dayCancelPrice: 0, dayNetPrice: 480000, dayOrderCount: 20, dayCancelCount: 0 },
];

const DISCOUNT_PRICE_MOCK = 150000;

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

export function buildSettlementMockResponse(dailySales: DailySale[]): SettlementResponse {
  const totalPrice = sum(dailySales.map((row) => row.dayTotalPrice ?? 0));
  const cancelPrice = sum(dailySales.map((row) => row.dayCancelPrice ?? 0));
  const orderCount = sum(dailySales.map((row) => row.dayOrderCount ?? 0));

  return {
    totalPrice,
    cancelPrice,
    discountPice: dailySales.length > 0 ? DISCOUNT_PRICE_MOCK : 0,
    netPrice: totalPrice - cancelPrice - (dailySales.length > 0 ? DISCOUNT_PRICE_MOCK : 0),
    orderCount,
    dailySales,
  };
}

export const SETTLEMENT_MOCK: SettlementResponse = buildSettlementMockResponse(SETTLEMENT_DAILY_SALES_MOCK);
