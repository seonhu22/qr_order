package htms.QROrder.auth.exception;

public class BusinessRegiException extends RuntimeException {

    public BusinessRegiException(String message) {
        super(message);
    }

    public BusinessRegiException(String message, Throwable cause) {
        super(message, cause);
    }
}
