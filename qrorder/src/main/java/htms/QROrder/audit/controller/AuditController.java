package htms.QROrder.audit.controller;

import htms.QROrder.audit.domain.TableInfo;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.audit.service.ErrorService;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Controller
@ControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
@RequiredArgsConstructor
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService auditService;
    private final ErrorService errorService;

    @GetMapping("/table_info/search")
    public List<TableInfo> getTableInfo(@RequestParam String tableName) {
        return auditService.getTableInfo(tableName);
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseBody
    public ResponseEntity<CommonResponse> handleException(RuntimeException e, HttpServletRequest request) {
        if (e instanceof BusinessRegiException) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(CommonResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        }

        HttpSession session = request.getSession(false);

        String menuCd = null;
        String userId = null;
        String sysPlantCd = null;

        if (session != null) {
            Login loginUser = (Login) session.getAttribute("loginUser");
            menuCd = (String) session.getAttribute("menuCd");
            if (loginUser != null) {
                userId = loginUser.getUserId();
                sysPlantCd = loginUser.getSysPlantCd();
            }
        }

        try {
            errorService.saveErrorInfo(e, menuCd, userId, sysPlantCd);
        } catch (Exception saveEx) {
            log.error("오류 저장 실패: {}", saveEx.getMessage());
        }

        log.error("예외 발생 - menuCd: {}, userId: {}", menuCd, userId, e);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(CommonResponse.builder()
                        .success(false)
                        .message("오류가 발생했습니다. 관리자에게 문의 바랍니다.")
                        .error(e.getMessage())
                        .build());
    }
}
