package htms.QROrder.system.billing.domain;

import java.time.Instant;

/**
 * 잠금 뒤 다시 읽은 행과 제공자 재조회로 만든 판정 입력. 잠금 전 판단은 넣지 않는다.
 *
 * @param now                     서버 Clock 기준 현재 시각
 * @param paidThroughAt           결제된 기간 끝
 * @param graceUntil              PAST_DUE 유예 끝
 * @param endAt                   해지 예약 종료 시각
 * @param checkoutOpen            열린 결제 시도가 아직 유효함(E1, PENDING)
 * @param nextPeriodInvoice       결제된 인보이스가 다음 회차임(E2, ACTIVE)
 * @param providerConfirmedFailed 제공자 재조회 결과가 FAILED임(E3, ACTIVE)
 * @param latestOpenInvoice       실패 인보이스가 최신 미결 회차임(E3, ACTIVE)
 * @param resubscribeAllowed      직전 대표 본인, 제공자 종료 확인, 미결 인보이스 0건(E1, EXPIRED)
 */
public record SubscriptionFacts(
        Instant now,
        Instant paidThroughAt,
        Instant graceUntil,
        Instant endAt,
        boolean checkoutOpen,
        boolean nextPeriodInvoice,
        boolean providerConfirmedFailed,
        boolean latestOpenInvoice,
        boolean resubscribeAllowed) {

    public static SubscriptionFacts at(Instant now) {
        return new SubscriptionFacts(now, null, null, null, false, false, false, false, false);
    }

    public SubscriptionFacts withPaidThroughAt(Instant value) {
        return new SubscriptionFacts(now, value, graceUntil, endAt, checkoutOpen, nextPeriodInvoice,
                providerConfirmedFailed, latestOpenInvoice, resubscribeAllowed);
    }

    public SubscriptionFacts withGraceUntil(Instant value) {
        return new SubscriptionFacts(now, paidThroughAt, value, endAt, checkoutOpen, nextPeriodInvoice,
                providerConfirmedFailed, latestOpenInvoice, resubscribeAllowed);
    }

    public SubscriptionFacts withEndAt(Instant value) {
        return new SubscriptionFacts(now, paidThroughAt, graceUntil, value, checkoutOpen, nextPeriodInvoice,
                providerConfirmedFailed, latestOpenInvoice, resubscribeAllowed);
    }

    public SubscriptionFacts withCheckoutOpen(boolean value) {
        return new SubscriptionFacts(now, paidThroughAt, graceUntil, endAt, value, nextPeriodInvoice,
                providerConfirmedFailed, latestOpenInvoice, resubscribeAllowed);
    }

    public SubscriptionFacts withNextPeriodInvoice(boolean value) {
        return new SubscriptionFacts(now, paidThroughAt, graceUntil, endAt, checkoutOpen, value,
                providerConfirmedFailed, latestOpenInvoice, resubscribeAllowed);
    }

    public SubscriptionFacts withConfirmedLatestFailure(boolean providerFailed, boolean latestOpen) {
        return new SubscriptionFacts(now, paidThroughAt, graceUntil, endAt, checkoutOpen, nextPeriodInvoice,
                providerFailed, latestOpen, resubscribeAllowed);
    }

    public SubscriptionFacts withResubscribeAllowed(boolean value) {
        return new SubscriptionFacts(now, paidThroughAt, graceUntil, endAt, checkoutOpen, nextPeriodInvoice,
                providerConfirmedFailed, latestOpenInvoice, value);
    }
}
