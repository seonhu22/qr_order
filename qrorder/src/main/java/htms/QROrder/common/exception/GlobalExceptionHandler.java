package htms.QROrder.common.exception;

import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.auth.exception.EmailValidException;
import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.common.dto.CommonResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

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
