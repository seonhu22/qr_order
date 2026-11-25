import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancel,
  checkout,
  getInvoicesQueryKey,
  getViewQueryKey,
  invoices,
  reconcile,
  view,
} from '@/generated/client-subscription/client-subscription';
import type { InvoiceItem } from '@/generated/types/invoiceItem';
import type { SubscriptionView } from '@/generated/types/subscriptionView';
import { queryKeys } from '@/shared/api/queryKeys';
import { HttpError } from '@/shared/lib/httpClient';
import type { ClientSubscription, SubscriptionInvoiceRow, SubscriptionStatus } from '../types';

const STATUSES: readonly SubscriptionStatus[] = ['PENDING', 'ACTIVE', 'PAST_DUE', 'CANCEL_SCHEDULED', 'EXPIRED'];

function toStatus(value: string | undefined): SubscriptionStatus | null {
  return STATUSES.find((status) => status === value) ?? null;
}

export function mapSubscriptionView(response: SubscriptionView): ClientSubscription {
  return {
    hasSubscription: response.hasSubscription === true,
    status: toStatus(response.status),
    isOwner: response.owner === true,
    planSysId: response.planSysId ?? null,
    planName: response.planName ?? null,
    amount: response.amount ?? null,
    paidThroughAt: response.paidThroughAt ?? null,
    graceUntil: response.graceUntil ?? null,
    endAt: response.endAt ?? null,
    cardExpired: response.paymentMethodStatus === 'EXPIRED',
    roleGranted: response.roleGranted === true,
    lastFailureCode: response.lastFailureCode ?? null,
    canCheckout: response.canCheckout === true,
    canCancel: response.canCancel === true,
    plans: (response.plans ?? []).flatMap((plan) =>
      plan.planSysId && plan.planName && plan.amount != null
        ? [{ planSysId: plan.planSysId, planName: plan.planName, amount: plan.amount, periodMonth: plan.periodMonth ?? 1 }]
        : []),
  };
}

export function mapInvoice(item: InvoiceItem): SubscriptionInvoiceRow {
  return {
    invoiceSysId: item.invoiceSysId ?? '',
    status: item.status ?? '',
    amount: item.amount ?? 0,
    refundedAmount: item.refundedAmount ?? 0,
    periodStartAt: item.periodStartAt ?? null,
    periodEndAt: item.periodEndAt ?? null,
    paidAt: item.paidAt ?? null,
  };
}

/** 결제 시작 응답에서 이동할 주소. 가짜 PG = launch.redirectUrl. 다른 제공자는 SDK 연동 전이라 null. */
export function getCheckoutRedirectUrl(launch: { launch?: Record<string, string> } | undefined): string | null {
  const url = launch?.launch?.redirectUrl;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

export function getSubscriptionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError && error.message.trim() ? error.message : fallback;
}

export function useClientSubscription(enabled = true) {
  return useQuery({
    queryKey: getViewQueryKey(),
    queryFn: ({ signal }) => view(undefined, signal),
    select: mapSubscriptionView,
    enabled,
    retry: false,
  });
}

export function useSubscriptionInvoices(enabled: boolean) {
  return useQuery({
    queryKey: getInvoicesQueryKey(),
    queryFn: ({ signal }) => invoices(undefined, signal),
    select: (items) => items.map(mapInvoice),
    enabled,
    retry: false,
  });
}

function useRefreshSubscription() {
  const queryClient = useQueryClient();
  return async (next?: SubscriptionView) => {
    if (next) queryClient.setQueryData(getViewQueryKey(), next);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getViewQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getInvoicesQueryKey() }),
      // 결제가 반영되면 대표 역할(02 → 01)이 바뀐다. 메뉴/직원 관리 메뉴는 /api/auth/me 기준이다.
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
    ]);
  };
}

export function useCheckoutSubscription() {
  return useMutation({ mutationFn: (planSysId: string) => checkout({ planSysId }) });
}

export function useReconcileSubscription() {
  const refresh = useRefreshSubscription();
  return useMutation({ mutationFn: () => reconcile(), onSuccess: (next) => refresh(next) });
}

export function useCancelSubscription() {
  const refresh = useRefreshSubscription();
  return useMutation({ mutationFn: () => cancel(), onSuccess: (next) => refresh(next) });
}
