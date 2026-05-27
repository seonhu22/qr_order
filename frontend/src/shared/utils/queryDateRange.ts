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
