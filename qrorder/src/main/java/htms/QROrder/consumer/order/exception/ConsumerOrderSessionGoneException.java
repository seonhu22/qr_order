package htms.QROrder.consumer.order.exception;

public class ConsumerOrderSessionGoneException extends RuntimeException {
    public ConsumerOrderSessionGoneException(String message) {
        super(message);
    }
}
