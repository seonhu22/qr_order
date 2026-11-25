/** 구독 상태/인보이스 라벨과 시각/금액 표시. Client 구독 화면과 Admin 구독 관리가 같이 쓴다. */
export const SUBSCRIPTION_STATUS_LABEL: Record<string, string> = {
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
