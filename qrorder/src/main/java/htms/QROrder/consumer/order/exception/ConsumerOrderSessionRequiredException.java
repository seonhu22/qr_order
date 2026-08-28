package htms.QROrder.consumer.order.exception;

public class ConsumerOrderSessionRequiredException extends RuntimeException {
    public ConsumerOrderSessionRequiredException(String message) {
        super(message);
    }
}
