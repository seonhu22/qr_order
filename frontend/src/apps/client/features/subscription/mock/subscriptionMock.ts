import { http, HttpResponse } from 'msw';
import type { SubscriptionView } from '@/generated/types/subscriptionView';

/** dev:mock / 테스트 기본값: 구독 없는 매장. 화면 테스트는 server.use로 바꾼다. */
export const NO_SUBSCRIPTION_VIEW: SubscriptionView = {
  hasSubscription: false,
  owner: false,
  roleGranted: false,
  canCheckout: false,
  canCancel: false,
  plans: [],
};

export const PENDING_OWNER_VIEW: SubscriptionView = {
  hasSubscription: true,
  status: 'PENDING',
  owner: true,
  paymentMethodStatus: 'NONE',
  roleGranted: false,
  canCheckout: true,
  canCancel: true,
  plans: [{ planSysId: 'PLAN-1', planName: '기본 월간', amount: 29000, currency: 'KRW', periodMonth: 1 }],
};

export const subscriptionHandlers = [
  http.get('/api/client/subscription', () => HttpResponse.json(NO_SUBSCRIPTION_VIEW)),
  http.get('/api/client/subscription/invoices', () => HttpResponse.json([])),
];
