import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  detail,
  end,
  getDetailQueryKey,
  getListQueryKey,
  list,
  refund,
} from '@/generated/admin-subscription/admin-subscription';
import type { AdminSubscriptionDetail } from '@/generated/types/adminSubscriptionDetail';
import type { AdminSubscriptionList } from '@/generated/types/adminSubscriptionList';
import type { AdminSubscriptionRow } from '@/generated/types/adminSubscriptionRow';
import type { ListParams } from '@/generated/types/listParams';
import { HttpError } from '@/shared/lib/httpClient';
import type { AdminSubscriptionDetailModel, AdminSubscriptionListModel, AdminSubscriptionSummary } from '../types';

export const PROBLEM_LABEL: Record<string, string> = {
  MISMATCH: '불일치',
  STALE: '만료 뒤 결제',
  AFTER_CANCEL: '해지 뒤 결제',
  OWNER_MISSING: '대표 없음',
};

function summary(row: AdminSubscriptionRow): AdminSubscriptionSummary {
  return {
    subscriptionSysId: row.subscriptionSysId ?? '',
    plantCd: row.plantCd ?? '',
    plantNm: row.plantNm ?? '',
    ownerUserId: row.ownerUserId ?? '',
    ownerUserNm: row.ownerUserNm ?? '',
    ownerUserRole: row.ownerUserRole ?? '',
    status: row.status ?? '',
    planName: row.planName ?? '',
    amount: row.amount ?? null,
    paidThroughAt: row.paidThroughAt ?? null,
    graceUntil: row.graceUntil ?? null,
    endAt: row.endAt ?? null,
    roleGranted: row.roleGrantedYn === 'Y',
    cardExpired: row.paymentMethodStatus === 'EXPIRED',
    providerEndStatus: row.providerEndStatus ?? '',
    problemCount: row.problemCount ?? 0,
  };
}

export function mapAdminList(response: AdminSubscriptionList): AdminSubscriptionListModel {
  return {
    rows: (response.rows ?? []).map(summary),
    mismatchEvents: (response.mismatchEvents ?? []).map((event) => ({
      webhookId: event.webhookId ?? '',
      eventType: event.eventType ?? '',
      resourceId: event.resourceId ?? '',
      receivedAt: event.receivedAt ?? null,
      result: event.result ?? '',
    })),
  };
}

export function mapAdminDetail(response: AdminSubscriptionDetail): AdminSubscriptionDetailModel {
  return {
    subscription: summary(response.subscription ?? {}),
    providerSubscriptionId: response.providerSubscriptionId ?? '',
    canEnd: response.canEnd === true,
    invoices: (response.invoices ?? []).map((invoice) => ({
      invoiceSysId: invoice.invoiceSysId ?? '',
      providerInvoiceId: invoice.providerInvoiceId ?? '',
      status: invoice.status ?? '',
      amount: invoice.amount ?? 0,
      refundedAmount: invoice.refundedAmount ?? 0,
      refundable: invoice.refundable ?? 0,
      periodStartAt: invoice.periodStartAt ?? null,
      periodEndAt: invoice.periodEndAt ?? null,
      applyResult: invoice.applyResult ?? '',
      problem: invoice.problem === true,
    })),
    events: (response.events ?? []).map((event) => ({
      webhookId: event.webhookId ?? '',
      eventType: event.eventType ?? '',
      resourceId: event.resourceId ?? '',
      receivedAt: event.receivedAt ?? null,
      result: event.result ?? '',
    })),
  };
}

export function getAdminSubscriptionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError && error.message.trim() ? error.message : fallback;
}

export function useAdminSubscriptions(status: string, problemOnly: boolean) {
  // httpClient는 undefined도 "undefined" 문자열로 보내므로 값 있는 키만 넣는다.
  const params: ListParams = {
    ...(status ? { status } : {}),
    ...(problemOnly ? { problemOnly: true } : {}),
  };
  return useQuery({
    queryKey: getListQueryKey(params),
    queryFn: ({ signal }) => list(params, undefined, signal),
    select: mapAdminList,
    retry: false,
  });
}

export function useAdminSubscriptionDetail(sysId: string | null) {
  return useQuery({
    queryKey: getDetailQueryKey(sysId ?? ''),
    queryFn: ({ signal }) => detail(sysId ?? '', undefined, signal),
    select: mapAdminDetail,
    enabled: !!sysId,
    retry: false,
  });
}

function useRefreshAdmin() {
  const queryClient = useQueryClient();
  return (sysId: string) => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['/api/system/subscriptions'] }),
    queryClient.invalidateQueries({ queryKey: getDetailQueryKey(sysId) }),
  ]);
}

export function useRefundInvoice() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (input: { sysId: string; invoiceSysId: string; amount: number }) =>
      refund(input.sysId, { invoiceSysId: input.invoiceSysId, amount: input.amount }),
    onSuccess: (_result, input) => refresh(input.sysId),
  });
}

export function useEndSubscription() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: (sysId: string) => end(sysId),
    onSuccess: (_result, sysId) => refresh(sysId),
  });
}
