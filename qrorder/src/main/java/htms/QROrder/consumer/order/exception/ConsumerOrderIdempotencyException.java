package htms.QROrder.consumer.order.exception;

public class ConsumerOrderIdempotencyException extends RuntimeException {

    public static final String IN_PROGRESS = "IDEMPOTENCY_IN_PROGRESS";
    public static final String KEY_EXPIRED = "IDEMPOTENCY_KEY_EXPIRED";
    public static final String PAYLOAD_MISMATCH = "IDEMPOTENCY_PAYLOAD_MISMATCH";

    private final String errorCode;

    public ConsumerOrderIdempotencyException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
