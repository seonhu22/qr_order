package htms.QROrder.system.billing.domain;

/** 정책 4C §3의 이벤트 E1~E9. 제공자 이벤트 이름은 어댑터가 이 값으로 바꾼다. */
public enum SubscriptionEvent {
    /** E1 결제 시작. */
    CHECKOUT_START,
    /** E2 재조회로 확인한 인보이스 결제 완료. */
    INVOICE_PAID,
    /** E3 인보이스 결제 실패. */
    INVOICE_FAILED,
    /** E4 현재 회차 누적 전액 환불. */
    CURRENT_PERIOD_FULL_REFUND,
    /** E5 그 밖의 환불(부분/과거 회차). */
    OTHER_REFUND,
    /** E6 대표의 해지 요청. */
    CANCEL_REQUEST,
    /** E7 대표 계정 삭제 시도. */
    OWNER_DELETE,
    /** E8 배치의 기한 도래 확인. */
    DUE,
    /** E9 결제수단(카드) 만료. */
    PAYMENT_METHOD_EXPIRED
}
