export const MAX_QUERY_RANGE_DAYS = 7;

export type QueryDateRangeDraft = {
  startDate: string;
  endDate: string;
};

export type QueryDateRangeParams = {
  startDate: string;
  endDate: string;
  searchKeyword: string;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateTimeLocal(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function getCurrentDateTimeLocal() {
  return formatDateTimeLocal(new Date());
}

export function getDateTimeLocalDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateTimeLocal(date);
}

export function toQueryDateTimeParam(value: string) {
  return value ? `${value.replace('T', ' ')}:00` : '';
}

export function createDefaultQueryDateRangeDraft(
  maxRangeDays = MAX_QUERY_RANGE_DAYS,
): QueryDateRangeDraft {
  return {
    startDate: getDateTimeLocalDaysAgo(maxRangeDays),
    endDate: getCurrentDateTimeLocal(),
  };
}

export function createQueryDateRangeParams(
  draftStartDate: string,
  draftEndDate: string,
  draftKeyword = '',
): QueryDateRangeParams {
  return {
    startDate: toQueryDateTimeParam(draftStartDate),
    endDate: toQueryDateTimeParam(draftEndDate),
    searchKeyword: draftKeyword,
  };
}

export function createDefaultQueryDateRangeParams(maxRangeDays = MAX_QUERY_RANGE_DAYS) {
  const { startDate, endDate } = createDefaultQueryDateRangeDraft(maxRangeDays);
  return createQueryDateRangeParams(startDate, endDate);
}

/**
 * 시작일시를 기준으로 조회 제한(maxRangeDays) 내에서 가능한 가장 늦은 종료일시를 계산한다.
 * 계산된 종료일시가 현재 시각보다 미래이면, 오늘 날짜에 시작 시각을 적용한 값으로 대체한다.
 * 그 값마저 현재 시각보다 미래이면 현재 시각으로 대체한다.
 */
export function getAutoEndDate(startValue: string, maxRangeDays = MAX_QUERY_RANGE_DAYS) {
  if (!startValue) {
    return startValue;
  }

  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) {
    return startValue;
  }

  const maxEnd = new Date(start);
  maxEnd.setDate(maxEnd.getDate() + maxRangeDays);

  const now = new Date();
  if (maxEnd <= now) {
    return formatDateTimeLocal(maxEnd);
  }

  const cappedEnd = new Date(now);
  cappedEnd.setHours(start.getHours(), start.getMinutes(), 0, 0);
  return formatDateTimeLocal(cappedEnd > now ? now : cappedEnd);
}

export function validateQueryDateRange(
  startDate: string,
  endDate: string,
  maxRangeDays = MAX_QUERY_RANGE_DAYS,
) {
  if (!startDate || !endDate) {
    return '시작일시와 종료일시를 모두 입력해주세요.';
  }

  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();

  if (endMs < startMs) {
    return '종료일시는 시작일시보다 이후여야 합니다.';
  }

  const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
  if (diffDays > maxRangeDays) {
    return `조회 기간은 최대 ${maxRangeDays}일까지 설정할 수 있습니다.`;
  }

  return '';
}
