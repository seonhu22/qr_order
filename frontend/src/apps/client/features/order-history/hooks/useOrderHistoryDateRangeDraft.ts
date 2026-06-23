/**
 * @fileoverview 주문 이력 조회 날짜range + 프리셋 콤보 draft 상태 훅
 *
 * @description
 * 공용 `useDateRangePresetDraft`(기본 7일 / 최대 365일)를 이 화면 기본값으로 호출하는 thin wrapper.
 */

import { useDateRangePresetDraft } from '@/shared/hooks/useDateRangePresetDraft';

export const ORDER_HISTORY_DEFAULT_RANGE_DAYS = 7;
const ORDER_HISTORY_MAX_RANGE_DAYS = 365;

export function useOrderHistoryDateRangeDraft() {
  return useDateRangePresetDraft({
    defaultRangeDays: ORDER_HISTORY_DEFAULT_RANGE_DAYS,
    maxRangeDays: ORDER_HISTORY_MAX_RANGE_DAYS,
  });
}
