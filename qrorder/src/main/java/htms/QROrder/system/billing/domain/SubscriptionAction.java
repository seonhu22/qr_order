package htms.QROrder.system.billing.domain;

/** 전이 결과로 서비스가 실행할 부수 작업. 순수 함수는 실행하지 않고 목록만 돌려준다. */
public enum SubscriptionAction {
    /** 열린 결제 시도를 재개한다. */
    RESUME_CHECKOUT,
    /** 만료된 시도를 대사/종료한 뒤 새 시도를 연다. */
    START_NEW_CHECKOUT,
    /** PAST_DUE에서 결제수단 재등록 창을 연다. */
    REREGISTER_PAYMENT_METHOD,
    /** EXPIRED 행은 그대로 두고 새 PENDING 행을 만든다. */
    CREATE_NEW_SUBSCRIPTION,
    /** 대표 02를 01로 올린다. UPDATE 1행일 때만 role_granted_yn='Y'. */
    GRANT_ROLE,
    /** paid_through_at을 인보이스 기간 끝으로 앞으로만 옮긴다. */
    EXTEND_PERIOD,
    /** grace_until을 지운다. */
    CLEAR_GRACE,
    /** grace_until = paid_through_at + 7일. */
    SET_GRACE,
    /** last_failure_code를 기록한다. */
    RECORD_FAILURE,
    /** 해지 예약 뒤 결제. apply_result=AFTER_CANCEL, 환불 대기. */
    HOLD_REFUND_AFTER_CANCEL,
    /** 만료 뒤 결제. apply_result=STALE, 환불 대기. */
    HOLD_REFUND_STALE,
    /** role_granted_yn='Y'이고 role_revoked_at이 없을 때만 01을 02로 내린다. */
    REVOKE_ROLE,
    /** 커밋 뒤 제공자 구독 종료를 요청한다(provider_end_status). */
    END_PROVIDER,
    /** end_at = paid_through_at으로 고정한다. */
    FIX_END_AT,
    /** payment_method_status = EXPIRED. */
    MARK_PAYMENT_METHOD_EXPIRED
}
