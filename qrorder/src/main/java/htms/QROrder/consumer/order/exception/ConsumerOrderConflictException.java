package htms.QROrder.consumer.order.exception;

public class ConsumerOrderConflictException extends RuntimeException {
    public ConsumerOrderConflictException(String message) {
        super(message);
    }
}
