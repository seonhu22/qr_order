/**
 * @fileoverview 정산 조회 feature의 서버 연동 계층
 *
 * @description
 * 백엔드 응답 필드명이 `discountPice`(오타)로 내려오므로 mapper에서 `discountPrice`로 바로잡는다.
 * `cancelPrice`/`discountPice`는 양수 금액으로 내려온다고 가정하고 화면에서 `-` 부호를 붙여 표시한다
 * (백엔드 부호 컨벤션 미확인 — `decisions.md` ADR-013 참고).
 */

import { useGetSettlement } from '@/generated/payment-manage-controller/payment-manage-controller';
import type { DailySale } from '@/generated/types/dailySale';
import type { GetSettlementParams } from '@/generated/types/getSettlementParams';
import type { SettlementResponse } from '@/generated/types/settlementResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { SettlementRow, SettlementSearchParams, SettlementSummary } from '../types';

/** 테이블 날짜 컬럼은 항상 "YYYY-MM-DD HH:MM" 형식으로 표시한다. groupDate에 시간이 없으면 00:00을 붙인다. */
function formatSettlementDate(value?: string): string {
  if (!value) return '';
  const normalized = value.includes('T') ? value.replace('T', ' ') : value;
  return normalized.length > 10 ? normalized.slice(0, 16) : `${normalized} 00:00`;
}

export function mapToSettlementSummary(res: SettlementResponse): SettlementSummary {
  const dailySales = res.dailySales ?? [];

  return {
    totalPrice: res.totalPrice ?? 0,
    cancelPrice: res.cancelPrice ?? 0,
    discountPrice: res.discountPice ?? 0,
    netPrice: res.netPrice ?? 0,
    orderCount: res.orderCount ?? 0,
    cancelCount: dailySales.reduce((acc, row) => acc + (row.dayCancelCount ?? 0), 0),
  };
}

export function mapToSettlementRow(item: DailySale, index: number): SettlementRow {
  return {
    id: `${item.groupDate ?? 'row'}-${index}`,
    date: formatSettlementDate(item.groupDate),
    totalPrice: item.dayTotalPrice ?? 0,
    cancelPrice: item.dayCancelPrice ?? 0,
    netPrice: item.dayNetPrice ?? 0,
    orderCount: item.dayOrderCount ?? 0,
  };
}

export function useSettlementQuery(params: SettlementSearchParams) {
  const queryParams: GetSettlementParams = {
    settlementRequest: {
      searchStartDate: params.startDate,
      searchEndDate: params.endDate,
    },
  };

  return useGetSettlement(queryParams, {
    query: {
      queryKey: queryKeys.settlement.detail(params),
      enabled: Boolean(params.startDate && params.endDate),
      ...queryPolicies.searchResult,
    },
  });
}
