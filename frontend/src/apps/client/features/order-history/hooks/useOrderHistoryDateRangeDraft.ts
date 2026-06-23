/**
 * @fileoverview 주문 이력 조회 날짜범위 + 프리셋 콤보 draft 상태 훅
 *
 * @description
 * 기본 조회기간은 7일, 최대 허용 범위는 365일로 서로 달라 공용 `useQueryDateRangeDraft`를
 * 그대로 쓸 수 없다(그 훅은 초기값 offset과 검증 최대일수에 동일한 maxRangeDays를 사용).
 * 프리셋(이번 주/이번 달/최근 1년)이 선택된 상태에서는 시작·종료일 중 한쪽을 바꾸면
 * 프리셋 일수만큼 반대쪽 날짜를 자동으로 맞추고, 직접 선택(프리셋 없음) 상태에서는
 * 자동 계산 없이 입력값을 365일 제한으로만 검증한다.
 */

import { useState } from 'react';
import {
  createDefaultQueryDateRangeDraft,
  getAutoEndDate,
  getAutoStartDate,
  getCurrentDateTimeLocal,
  getDateTimeLocalDaysAgo,
  validateQueryDateRange,
} from '@/shared/utils/queryDateRange';
import type { OrderHistoryDatePresetKey } from '../types';

const PRESET_DAYS: Record<Exclude<OrderHistoryDatePresetKey, 'direct'>, number> = {
  week: 7,
  month: 30,
  year: 365,
};

const MAX_RANGE_DAYS = 365;
export const ORDER_HISTORY_DEFAULT_RANGE_DAYS = 7;
const DEFAULT_PRESET: OrderHistoryDatePresetKey = 'week';

export function useOrderHistoryDateRangeDraft() {
  const [draftPreset, setDraftPreset] = useState<OrderHistoryDatePresetKey>(DEFAULT_PRESET);
  const [{ startDate: draftStartDate, endDate: draftEndDate }, setDraftDateRange] = useState(() =>
    createDefaultQueryDateRangeDraft(ORDER_HISTORY_DEFAULT_RANGE_DAYS),
  );
  const [dateRangeError, setDateRangeError] = useState('');

  const validateDateRange = (start: string, end: string): boolean => {
    const nextError = validateQueryDateRange(start, end, MAX_RANGE_DAYS);
    setDateRangeError(nextError);
    return !nextError;
  };

  const handlePresetChange = (preset: OrderHistoryDatePresetKey) => {
    setDraftPreset(preset);
    if (preset === 'direct') return;

    const days = PRESET_DAYS[preset];
    const nextStart = getDateTimeLocalDaysAgo(days);
    const nextEnd = getCurrentDateTimeLocal();
    setDraftDateRange({ startDate: nextStart, endDate: nextEnd });
    validateDateRange(nextStart, nextEnd);
  };

  const handleStartDateChange = (value: string) => {
    const nextEnd =
      draftPreset !== 'direct' ? getAutoEndDate(value, PRESET_DAYS[draftPreset]) : draftEndDate;
    setDraftDateRange({ startDate: value, endDate: nextEnd });
    if (value && nextEnd) validateDateRange(value, nextEnd);
  };

  const handleEndDateChange = (value: string) => {
    const nextStart =
      draftPreset !== 'direct' ? getAutoStartDate(value, PRESET_DAYS[draftPreset]) : draftStartDate;
    setDraftDateRange({ startDate: nextStart, endDate: value });
    if (nextStart && value) validateDateRange(nextStart, value);
  };

  const resetDraftDateRange = () => {
    setDraftPreset(DEFAULT_PRESET);
    setDraftDateRange(createDefaultQueryDateRangeDraft(ORDER_HISTORY_DEFAULT_RANGE_DAYS));
    setDateRangeError('');
  };

  const validateDraftDateRange = () => validateDateRange(draftStartDate, draftEndDate);

  return {
    draftPreset,
    draftStartDate,
    draftEndDate,
    dateRangeError,
    handlePresetChange,
    handleStartDateChange,
    handleEndDateChange,
    resetDraftDateRange,
    validateDraftDateRange,
  };
}
