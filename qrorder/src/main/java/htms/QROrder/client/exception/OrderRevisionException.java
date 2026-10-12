package htms.QROrder.client.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class OrderRevisionException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    public OrderRevisionException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public static OrderRevisionException notFound() {
        return new OrderRevisionException(HttpStatus.NOT_FOUND, "ORDER_REVISION_TARGET_NOT_FOUND",
                "수정할 주문을 찾을 수 없습니다.");
    }

    public static OrderRevisionException conflict(String code, String message) {
        return new OrderRevisionException(HttpStatus.CONFLICT, code, message);
    }

    public static OrderRevisionException badRequest(String message) {
        return new OrderRevisionException(HttpStatus.BAD_REQUEST,
                "ORDER_REVISION_INVALID_REQUEST", message);
    }

    public static OrderRevisionException menuNotFound(String message) {
        return new OrderRevisionException(HttpStatus.NOT_FOUND,
                "ORDER_REVISION_MENU_NOT_FOUND", message);
    }
}
