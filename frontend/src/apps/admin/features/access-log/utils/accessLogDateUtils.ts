import {
  MAX_QUERY_RANGE_DAYS,
  createDefaultQueryDateRangeDraft,
  createDefaultQueryDateRangeParams,
  createQueryDateRangeParams,
  toQueryDateTimeParam,
  validateQueryDateRange,
  type QueryDateRangeParams,
} from '@/shared/utils/queryDateRange';

export const ACCESS_LOG_MAX_RANGE_DAYS = MAX_QUERY_RANGE_DAYS;

export type AccessLogSearchParams = QueryDateRangeParams;

export const getCurrentDateTimeLocal = () => createDefaultQueryDateRangeDraft().endDate;

export const getDateTimeLocalDaysAgo = (days: number) =>
  createDefaultQueryDateRangeDraft(days).startDate;

export const toAccessLogApiDatetime = toQueryDateTimeParam;

export const createDefaultAccessLogDateRangeDraft = createDefaultQueryDateRangeDraft;

export const createAccessLogSearchParams = createQueryDateRangeParams;

export const createDefaultAccessLogSearchParams = createDefaultQueryDateRangeParams;

export const validateAccessLogDateRange = validateQueryDateRange;
