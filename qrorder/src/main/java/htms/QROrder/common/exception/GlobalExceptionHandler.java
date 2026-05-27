package htms.QROrder.common.exception;

import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.common.dto.CommonResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<CommonResponse> handleException(Exception e) {
        log.error("Unhandled exception", e);
        String cause = e.getCause() != null ? e.getCause().getMessage() : null;
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message("오류가 발생했습니다. 관리자에게 문의 바랍니다.")
                        .error(e.getMessage() + (cause != null ? " | Caused by: " + cause : ""))
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
}
