package htms.QROrder.consumer.order.exception;

public class ConsumerOrderExpiredRequestException extends RuntimeException {
    public ConsumerOrderExpiredRequestException(String message) {
        super(message);
    }
}
