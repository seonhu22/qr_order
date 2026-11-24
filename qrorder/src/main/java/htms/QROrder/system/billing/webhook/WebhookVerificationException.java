package htms.QROrder.system.billing.webhook;

/** 웹훅 서명 검증 실패. 응답은 언제나 401이고 이유는 로그에만 남긴다. */
public class WebhookVerificationException extends RuntimeException {
    public enum Reason { MISSING_HEADER, INVALID_TIMESTAMP, TIMESTAMP_OUT_OF_TOLERANCE, SIGNATURE_MISMATCH }

    private final Reason reason;

    public WebhookVerificationException(Reason reason) {
        super("webhook verification failed: " + reason);
        this.reason = reason;
    }

    public Reason reason() {
        return reason;
    }
}
