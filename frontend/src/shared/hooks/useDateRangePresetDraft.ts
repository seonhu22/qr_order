/**
 * @fileoverview 날짜range + 기간 프리셋 콤보 draft 상태 공용 훅
 *
 * @description
 * `useQueryDateRangeDraft`는 "초기값 offset"과 "검증 최대일수"에 같은 maxRangeDays를 쓰지만,
 * `OrderHistory`/`PaymentStatus`처럼 기본 조회기간(예: 7일)과 최대 허용기간(예: 365일)이 다른 화면에서는
 * 두 값을 분리해야 해서 이 훅을 따로 둔다.
 *
 * 프리셋(이번 주/이번 달/최근 1년)이 선택된 상태에서는 시작·종료일시 중 한쪽을 바꾸면
 * 프리셋 일수만큼 반대쪽 날짜를 자동으로 맞추고(`getAutoEndDate`/`getAutoStartDate`),
 * 직접 선택(프리셋 없음) 상태에서는 자동 계산 없이 입력값을 최대일수로만 검증한다.
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

/** 'direct'는 자동 계산 없는 "직접 선택" 상태를 의미한다. */
export type DateRangePresetKey = 'direct' | 'week' | 'month' | 'year';

const PRESET_DAYS: Record<Exclude<DateRangePresetKey, 'direct'>, number> = {
  week: 7,
  month: 30,
  year: 365,
};

type UseDateRangePresetDraftOptions = {
  /** 기본 조회기간(일) — 페이지 진입/초기화 시 적용 */
  defaultRangeDays: number;
  /** 최대 허용 조회기간(일) — 직접 선택 시 검증 기준, 프리셋 적용 시 자동계산 캡 */
  maxRangeDays: number;
  /** 초기 프리셋 선택값 (기본 'week') */
  defaultPreset?: DateRangePresetKey;
};

export function useDateRangePresetDraft({
  defaultRangeDays,
  maxRangeDays,
  defaultPreset = 'week',
}: UseDateRangePresetDraftOptions) {
  const [draftPreset, setDraftPreset] = useState<DateRangePresetKey>(defaultPreset);
  const [{ startDate: draftStartDate, endDate: draftEndDate }, setDraftDateRange] = useState(() =>
    createDefaultQueryDateRangeDraft(defaultRangeDays),
  );
  const [dateRangeError, setDateRangeError] = useState('');

  const validateDateRange = (start: string, end: string): boolean => {
    const nextError = validateQueryDateRange(start, end, maxRangeDays);
    setDateRangeError(nextError);
    return !nextError;
  };

  const handlePresetChange = (preset: DateRangePresetKey) => {
    setDraftPreset(preset);
    if (preset === 'direct') return;

    const days = PRESET_DAYS[preset];
    const nextStart = getDateTimeLocalDaysAgo(days);
    const nextEnd = getCurrentDateTimeLocal();
    setDraftDateRange({ startDate: nextStart, endDate: nextEnd });
    validateDateRange(nextStart, nextEnd);
  };

  const handleStartDateChange = (value: string) => {
    const nextEnd = draftPreset !== 'direct' ? getAutoEndDate(value, PRESET_DAYS[draftPreset]) : draftEndDate;
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
    setDraftPreset(defaultPreset);
    setDraftDateRange(createDefaultQueryDateRangeDraft(defaultRangeDays));
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
