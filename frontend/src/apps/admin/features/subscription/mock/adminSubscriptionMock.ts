import type { AdminSubscriptionDetail } from '@/generated/types/adminSubscriptionDetail';
import type { AdminSubscriptionList } from '@/generated/types/adminSubscriptionList';

export const ADMIN_SUBSCRIPTION_LIST_MOCK: AdminSubscriptionList = {
  rows: [
    {
      subscriptionSysId: 'SUB-A', plantCd: '9990000001', plantNm: '대표 컴퍼니', ownerUserSysId: 'U-1',
      ownerUserId: 'owner_a', ownerUserNm: '대표', ownerUserRole: '01', status: 'CANCEL_SCHEDULED',
      planName: '기본 월간', amount: 29000, paidThroughAt: '2026-12-25T03:00:00Z', endAt: '2026-12-25T03:00:00Z',
      roleGrantedYn: 'Y', paymentMethodStatus: 'ACTIVE', providerEndStatus: 'NONE', problemCount: 1,
    },
  ],
  mismatchEvents: [
    { webhookId: 'msg_9', eventType: 'Invoice.Paid', resourceId: 'inv_9', receivedAt: '2026-11-25T03:00:00Z', result: 'MISMATCH' },
  ],
};

export const ADMIN_SUBSCRIPTION_DETAIL_MOCK: AdminSubscriptionDetail = {
  subscription: ADMIN_SUBSCRIPTION_LIST_MOCK.rows?.[0],
  providerSubscriptionId: 'sub_1',
  canEnd: true,
  invoices: [
    {
      invoiceSysId: 'INV-2', providerInvoiceId: 'inv_2', status: 'PAID', amount: 29000, refundedAmount: 0,
      attemptCount: 1, periodStartAt: '2026-12-25T03:00:00Z', periodEndAt: '2027-01-25T03:00:00Z',
      applyResult: 'AFTER_CANCEL', problem: true, refundable: 29000,
    },
    {
      invoiceSysId: 'INV-1', providerInvoiceId: 'inv_1', status: 'PAID', amount: 29000, refundedAmount: 0,
      attemptCount: 1, periodStartAt: '2026-11-25T03:00:00Z', periodEndAt: '2026-12-25T03:00:00Z',
      applyResult: 'APPLIED', problem: false, refundable: 29000,
    },
  ],
  events: [
    { webhookId: 'msg_1', eventType: 'Invoice.Paid', resourceId: 'inv_1', receivedAt: '2026-11-25T03:00:00Z', result: 'PROCESSED' },
  ],
};
