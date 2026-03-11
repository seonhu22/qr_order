package htms.QROrder.common.exception;

import htms.QROrder.common.dto.CommonResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateException.class)
    public ResponseEntity<CommonResponse<Void>> handleDuplicatePlantException(DuplicateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(e.getMessage())
                        .build()
                );
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<CommonResponse<Void>> handleValidationException(ValidationException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message(e.getMessage())
                        .build()
                );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<CommonResponse<Void>> handleException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(CommonResponse.<Void>builder()
                        .success(false)
                        .message("오류가 발생했습니다. 관리자에게 문의 바랍니다.")
                        .error(e.getMessage())
                        .build()
                );
    }
}
