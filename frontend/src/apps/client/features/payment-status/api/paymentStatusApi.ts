/**
 * @fileoverview 결제 목록 조회 feature의 서버 연동 계층
 *
 * @description
 * 백엔드 결제상태(`orderStatus`) enum이 아직 공개되지 않아 PAID/UNPAID 값을 임시로 정해 사용한다
 * (식사중·취소 등은 다루지 않기로 결정 — 결제완료/미결제 2가지만 구분).
 * 알 수 없는 값은 'UNPAID'로 fallback 한다. 상세 조회 응답은 배열로 오지만 화면은 단일 폼이므로
 * 첫 번째 요소만 사용한다(배열인 이유는 백엔드 연동 시 확인 필요).
 */

import {
  useGetPaymentInfoDetail,
  useGetPaymentInfoMaster,
} from '@/generated/payment-manage-controller/payment-manage-controller';
import type { PaymentInfoDetailResponse } from '@/generated/types/paymentInfoDetailResponse';
import type { PaymentInfoMasterResponse } from '@/generated/types/paymentInfoMasterResponse';
import { queryKeys } from '@/shared/api/queryKeys';
import { queryPolicies } from '@/shared/api/queryPolicies';
import type { PaymentStatusCode, PaymentStatusDetail, PaymentStatusMasterRow, PaymentStatusSearchParams } from '../types';

function toPaymentStatusCode(value?: string): PaymentStatusCode {
  return value === 'PAID' ? value : 'UNPAID';
}

export function mapToPaymentStatusMasterRow(item: PaymentInfoMasterResponse): PaymentStatusMasterRow {
  return {
    id: item.sysId ?? '',
    orderNo: item.orderNum != null ? String(item.orderNum) : '',
    paymentType: item.paymentType ?? '',
    totalPrice: item.totalPrice ?? 0,
    paymentStatus: toPaymentStatusCode(item.orderStatus),
  };
}

/**
 * 결제 수단은 상세 조회 API 응답에 없어, 마스터 목록에서 선택된 행의 값(paymentType)을 그대로 받아 채운다.
 */
export function mapToPaymentStatusDetail(
  items: PaymentInfoDetailResponse[],
  paymentType: string,
): PaymentStatusDetail | null {
  const detail = items[0];
  if (!detail) return null;

  return {
    orderNo: detail.orderNum != null ? String(detail.orderNum) : '',
    paymentStatus: toPaymentStatusCode(detail.orderStatus),
    paymentType,
    cancelReason: detail.cancelReason ?? '',
    items: detail.items ?? '',
    cancelDescription: detail.cancelDescription ?? '',
  };
}

export function usePaymentStatusMasterQuery(params: PaymentStatusSearchParams) {
  const queryParams = {
    paymentStatus: params.paymentStatus,
    startDate: params.startDate,
    endDate: params.endDate,
  };

  return useGetPaymentInfoMaster(queryParams, {
    query: {
      queryKey: queryKeys.paymentStatus.masters(queryParams),
      enabled: Boolean(params.startDate && params.endDate),
      ...queryPolicies.searchResult,
    },
  });
}

export function usePaymentStatusDetailQuery(masterSysId: string) {
  return useGetPaymentInfoDetail(masterSysId, {
    query: {
      queryKey: queryKeys.paymentStatus.details(masterSysId),
      enabled: Boolean(masterSysId),
      ...queryPolicies.searchResult,
    },
  });
}
