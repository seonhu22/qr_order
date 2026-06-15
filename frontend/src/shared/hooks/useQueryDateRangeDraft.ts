/**
 * @fileoverview datetime-local 날짜 범위 draft 상태 공용 훅
 *
 * @description
 * - `draftStartDate` / `draftEndDate` / `dateRangeError`를 공통 규약으로 관리한다.
 * - 시작일시를 변경하면 조회 제한(maxRangeDays) 내에서 가능한 가장 늦은 종료일시를 자동으로 채운다.
 * - 종료일시를 변경하면 시작일시 기준으로 범위를 검증한다.
 *
 * @remarks
 * 조회 제한(maxRangeDays)은 화면마다 다를 수 있다(예: 1주, 1개월, 1년).
 * 인자로 받은 maxRangeDays는 자동 종료일시 계산과 범위 검증에 동일하게 사용된다.
 */

import { useState } from 'react';
import {
  MAX_QUERY_RANGE_DAYS,
  createDefaultQueryDateRangeDraft,
  getAutoEndDate,
  validateQueryDateRange,
} from '@/shared/utils/queryDateRange';

type UseQueryDateRangeDraftReturn = {
  draftStartDate: string;
  draftEndDate: string;
  dateRangeError: string;
  handleStartDateChange: (value: string) => void;
  handleEndDateChange: (value: string) => void;
  resetDraftDateRange: () => void;
  validateDraftDateRange: () => boolean;
};

/**
 * datetime-local 날짜 범위 필터의 draft 상태를 관리한다.
 *
 * @param {number} [maxRangeDays=MAX_QUERY_RANGE_DAYS] 최대 조회 기간(일)
 * @returns {UseQueryDateRangeDraftReturn}
 *
 * @example
 * ```tsx
 * const {
 *   draftStartDate,
 *   draftEndDate,
 *   dateRangeError,
 *   handleStartDateChange,
 *   handleEndDateChange,
 *   resetDraftDateRange,
 *   validateDraftDateRange,
 * } = useQueryDateRangeDraft(maxRangeDays);
 *
 * const handleSearch = () => {
 *   if (!validateDraftDateRange()) return;
 *   setSearchParams(createQueryDateRangeParams(draftStartDate, draftEndDate, draftKeyword));
 * };
 * ```
 */
export function useQueryDateRangeDraft(
  maxRangeDays: number = MAX_QUERY_RANGE_DAYS,
): UseQueryDateRangeDraftReturn {
  const [{ startDate: draftStartDate, endDate: draftEndDate }, setDraftDateRange] = useState(() =>
    createDefaultQueryDateRangeDraft(maxRangeDays),
  );
  const [dateRangeError, setDateRangeError] = useState('');

  const validateDateRange = (start: string, end: string): boolean => {
    const nextError = validateQueryDateRange(start, end, maxRangeDays);
    setDateRangeError(nextError);
    return !nextError;
  };

  const handleStartDateChange = (value: string) => {
    const nextEndDate = value ? getAutoEndDate(value, maxRangeDays) : draftEndDate;
    setDraftDateRange({ startDate: value, endDate: nextEndDate });
    if (value && nextEndDate) validateDateRange(value, nextEndDate);
  };

  const handleEndDateChange = (value: string) => {
    setDraftDateRange({ startDate: draftStartDate, endDate: value });
    if (draftStartDate) validateDateRange(draftStartDate, value);
  };

  const resetDraftDateRange = () => {
    setDraftDateRange(createDefaultQueryDateRangeDraft(maxRangeDays));
    setDateRangeError('');
  };

  const validateDraftDateRange = () => validateDateRange(draftStartDate, draftEndDate);

  return {
    draftStartDate,
    draftEndDate,
    dateRangeError,
    handleStartDateChange,
    handleEndDateChange,
    resetDraftDateRange,
    validateDraftDateRange,
  };
}
