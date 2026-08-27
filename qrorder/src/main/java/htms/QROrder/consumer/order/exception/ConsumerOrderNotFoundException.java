package htms.QROrder.consumer.order.exception;

public class ConsumerOrderNotFoundException extends RuntimeException {
    public ConsumerOrderNotFoundException(String message) {
        super(message);
    }
}
