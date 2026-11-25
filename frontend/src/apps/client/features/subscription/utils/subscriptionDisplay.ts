import type { ClientSubscription, SubscriptionBannerKind, SubscriptionStatus } from '../types';

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  PENDING: '결제 전',
  ACTIVE: '구독 중',
  PAST_DUE: '결제 실패(유예 중)',
  CANCEL_SCHEDULED: '해지 예약',
  EXPIRED: '만료',
};

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  PENDING: '결제 중',
  PAID: '결제 완료',
  FAILED: '결제 실패',
  PARTIALLY_REFUNDED: '부분 환불',
  REFUNDED: '환불 완료',
};

const KST_FORMAT = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** 서버 시각(ISO, UTC)을 KST "YYYY-MM-DD HH:mm"로. 값이 없거나 형식이 틀리면 빈 문자열. */
export function formatKst(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : KST_FORMAT.format(date);
}

export function formatWon(amount: number | null | undefined): string {
  return amount == null ? '' : `${amount.toLocaleString('ko-KR')}원`;
}

const OPEN_STATUSES: readonly (SubscriptionStatus | null)[] = ['ACTIVE', 'PAST_DUE', 'CANCEL_SCHEDULED'];

/**
 * 레이아웃 배너. 결제 전 02 대표에게는 열리는 기능을, 진행 중 구독의 카드가 만료되면 모두에게 재등록 안내를.
 * staffRole은 /api/auth/me 기준(결제 직후 01이 되면 첫 배너는 사라진다).
 */
export function getSubscriptionBanners(
  subscription: ClientSubscription | undefined,
  staffRole: string | undefined,
): SubscriptionBannerKind[] {
  if (!subscription?.hasSubscription) return [];
  const banners: SubscriptionBannerKind[] = [];
  if (subscription.isOwner && staffRole === '02' && subscription.status !== 'CANCEL_SCHEDULED') {
    banners.push('ownerBeforePayment');
  }
  if (subscription.cardExpired && OPEN_STATUSES.includes(subscription.status)) banners.push('cardExpired');
  return banners;
}

/** 상태 한 줄 설명(기간/유예/종료 시각 포함). */
export function describeSubscription(subscription: ClientSubscription): string {
  switch (subscription.status) {
    case 'PENDING':
      return '결제하면 바로 메뉴/직원 관리가 열립니다.';
    case 'ACTIVE':
      return `${formatKst(subscription.paidThroughAt)}까지 이용할 수 있습니다. 다음 결제는 자동으로 진행됩니다.`;
    case 'PAST_DUE':
      return `갱신 결제에 실패했습니다. ${formatKst(subscription.graceUntil)}까지 결제수단을 다시 등록하지 않으면 만료됩니다.`;
    case 'CANCEL_SCHEDULED':
      return `${formatKst(subscription.endAt)}에 구독이 끝납니다. 그때까지는 그대로 이용할 수 있습니다.`;
    case 'EXPIRED':
      return '구독이 만료되었습니다. 다시 결제하면 이용할 수 있습니다.';
    default:
      return '';
  }
}
