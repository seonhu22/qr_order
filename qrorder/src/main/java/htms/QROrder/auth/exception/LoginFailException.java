package htms.QROrder.auth.exception;

public class LoginFailException extends RuntimeException {
    private final Object data;

    public LoginFailException(String message) {
        super(message);
        this.data = null;
    }

    public LoginFailException(String message, Object data) {
        super(message);
        this.data = data;
    }

    public Object getData() {
        return data;
    }
}
