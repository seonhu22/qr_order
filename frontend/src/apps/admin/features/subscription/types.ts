export type AdminSubscriptionSummary = {
  subscriptionSysId: string;
  plantCd: string;
  plantNm: string;
  ownerUserId: string;
  ownerUserNm: string;
  ownerUserRole: string;
  status: string;
  planName: string;
  amount: number | null;
  paidThroughAt: string | null;
  graceUntil: string | null;
  endAt: string | null;
  roleGranted: boolean;
  cardExpired: boolean;
  providerEndStatus: string;
  problemCount: number;
};

export type AdminWebhookEvent = {
  webhookId: string;
  eventType: string;
  resourceId: string;
  receivedAt: string | null;
  result: string;
};

export type AdminInvoiceRow = {
  invoiceSysId: string;
  providerInvoiceId: string;
  status: string;
  amount: number;
  refundedAmount: number;
  refundable: number;
  periodStartAt: string | null;
  periodEndAt: string | null;
  applyResult: string;
  problem: boolean;
};

export type AdminSubscriptionListModel = {
  rows: AdminSubscriptionSummary[];
  mismatchEvents: AdminWebhookEvent[];
};

export type AdminSubscriptionDetailModel = {
  subscription: AdminSubscriptionSummary;
  providerSubscriptionId: string;
  canEnd: boolean;
  invoices: AdminInvoiceRow[];
  events: AdminWebhookEvent[];
};
