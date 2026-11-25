package htms.QROrder.system.billing.domain;

/**
 * ACTIVE 구독의 기한 도래(E8) 전에 잠금 밖에서 제공자를 대사한 결과(정책 4C §3).
 * 웹훅 유실로 갱신 결제를 못 받은 대표를 강등하지 않으려고, 대사 성공 + 놓친 결제 없음일 때만 만료한다.
 */
public enum ProviderReconcile {
    /** 대사하지 않음. 만료 판단 불가. */
    NOT_RUN,
    /** 제공자 조회 실패. 다음 배치에서 다시 대사한다. */
    FAILED,
    /** 대사 성공, 받지 못한 갱신 결제 없음. */
    NO_UNSEEN_PAYMENT,
    /** 대사 성공, 받지 못한 갱신 결제가 있음. 호출자가 먼저 E2로 반영한다. */
    UNSEEN_PAYMENT
}
