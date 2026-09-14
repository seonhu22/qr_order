package htms.QROrder.common.exception;

import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.auth.exception.EmailValidException;
import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.common.dto.CommonResponse;
import htms.QROrder.consumer.order.exception.ConsumerOrderConflictException;
import htms.QROrder.consumer.order.exception.ConsumerOrderIdempotencyException;
import htms.QROrder.consumer.order.exception.ConsumerOrderNotFoundException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionRequiredException;
import htms.QROrder.consumer.order.exception.ConsumerTableInactiveException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateException.class)
    public ResponseEntity<CommonResponse> handleDuplicatePlantException(DuplicateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(CommonResponse.<Object>builder()
                        .success(false)
                        .message(e.getMessage())
                        .build()
                );
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<CommonResponse> handleValidationException(ValidationException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(e.getMessage())
                        .build()
                );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<CommonResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException e) {
        return errorResponse(HttpStatus.BAD_REQUEST, "요청 본문을 확인해주세요.");
    }

    @ExceptionHandler(ConsumerOrderSessionRequiredException.class)
    public ResponseEntity<CommonResponse> handleConsumerOrderSessionRequired(
            ConsumerOrderSessionRequiredException e) {
        return errorResponse(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(ConsumerOrderSessionGoneException.class)
    public ResponseEntity<CommonResponse> handleConsumerOrderSessionGone(
            ConsumerOrderSessionGoneException e) {
        return errorResponse(HttpStatus.GONE, e.getMessage());
    }

    @ExceptionHandler(ConsumerOrderNotFoundException.class)
    public ResponseEntity<CommonResponse> handleConsumerOrderNotFound(
            ConsumerOrderNotFoundException e) {
        return errorResponse(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(ConsumerOrderConflictException.class)
    public ResponseEntity<CommonResponse> handleConsumerOrderConflict(
            ConsumerOrderConflictException e) {
        return errorResponse(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(ConsumerOrderIdempotencyException.class)
    public ResponseEntity<CommonResponse> handleConsumerOrderIdempotency(
            ConsumerOrderIdempotencyException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(e.getMessage())
                        .error(e.getErrorCode())
                        .build());
    }

    @ExceptionHandler(ConsumerTableInactiveException.class)
    public ResponseEntity<CommonResponse> handleConsumerTableInactive(
            ConsumerTableInactiveException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(e.getMessage())
                        .error("TABLE_INACTIVE")
                        .build());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<CommonResponse> handleResponseStatusException(
            ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode())
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(e.getReason())
                        .build());
    }

    @ExceptionHandler(EmailValidException.class)
    public ResponseEntity<CommonResponse> handleEmailValidException(EmailValidException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(e.getMessage())
                        .build()
                );
    }

    @ExceptionHandler(BusinessRegiException.class)
    public ResponseEntity<CommonResponse> handleBusinessRegiException(BusinessRegiException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(e.getMessage())
                        .build()
                );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<CommonResponse> handleNoResourceFound(NoResourceFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message("리소스를 찾을 수 없습니다.")
                        .build()
                );
    }

    @ExceptionHandler(LoginFailException.class)
    public ResponseEntity<CommonResponse> handleLoginFailException(LoginFailException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(CommonResponse.<Object>builder()
                        .success(false)
                        .message(e.getMessage())
                        .data(e.getData())
                        .build()
                );
    }

    private ResponseEntity<CommonResponse> errorResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(message)
                        .build());
    }
}
