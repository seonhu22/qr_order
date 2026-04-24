export const ACCESS_LOG_MAX_RANGE_DAYS = 7;

export type AccessLogSearchParams = {
  startDate: string;
  endDate: string;
  searchKeyword: string;
};

type AccessLogDateRangeDraft = {
  startDate: string;
  endDate: string;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateTimeLocal(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getCurrentDateTimeLocal() {
  return formatDateTimeLocal(new Date());
}

export function getDateTimeLocalDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateTimeLocal(date);
}

export function toAccessLogApiDatetime(value: string) {
  return value ? `${value.replace('T', ' ')}:00` : '';
}

export function createDefaultAccessLogDateRangeDraft(): AccessLogDateRangeDraft {
  return {
    startDate: getDateTimeLocalDaysAgo(ACCESS_LOG_MAX_RANGE_DAYS),
    endDate: getCurrentDateTimeLocal(),
  };
}

export function createAccessLogSearchParams(
  draftStartDate: string,
  draftEndDate: string,
  draftKeyword = '',
): AccessLogSearchParams {
  return {
    startDate: toAccessLogApiDatetime(draftStartDate),
    endDate: toAccessLogApiDatetime(draftEndDate),
    searchKeyword: draftKeyword,
  };
}

export function createDefaultAccessLogSearchParams(): AccessLogSearchParams {
  const { startDate, endDate } = createDefaultAccessLogDateRangeDraft();

  return createAccessLogSearchParams(startDate, endDate);
}

export function validateAccessLogDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    return '시작일시와 종료일시를 모두 입력해주세요.';
  }

  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();

  if (endMs < startMs) {
    return '종료일시는 시작일시보다 이후여야 합니다.';
  }

  const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);

  if (diffDays > ACCESS_LOG_MAX_RANGE_DAYS) {
    return `조회 기간은 최대 ${ACCESS_LOG_MAX_RANGE_DAYS}일까지 설정할 수 있습니다.`;
  }

  return '';
}
