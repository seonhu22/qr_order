export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCEL_SCHEDULED' | 'EXPIRED';

export type SubscriptionPlan = {
  planSysId: string;
  planName: string;
  amount: number;
  periodMonth: number;
};

/** 화면 상태. 서버 SubscriptionView를 api 경계에서 바꾼 값. */
export type ClientSubscription = {
  hasSubscription: boolean;
  status: SubscriptionStatus | null;
  isOwner: boolean;
  planSysId: string | null;
  planName: string | null;
  amount: number | null;
  paidThroughAt: string | null;
  graceUntil: string | null;
  endAt: string | null;
  cardExpired: boolean;
  roleGranted: boolean;
  lastFailureCode: string | null;
  canCheckout: boolean;
  canCancel: boolean;
  plans: SubscriptionPlan[];
};

export type SubscriptionInvoiceRow = {
  invoiceSysId: string;
  status: string;
  amount: number;
  refundedAmount: number;
  periodStartAt: string | null;
  periodEndAt: string | null;
  paidAt: string | null;
};

export type SubscriptionBannerKind = 'ownerBeforePayment' | 'cardExpired';
