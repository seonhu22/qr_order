package htms.Initial.auth.controller;

import htms.Initial.log.service.LogService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class LogoutController {

    private final LogService logService;

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        String logUuid = (String) session.getAttribute("logUuid");
        if (logUuid != null) {
            logService.insertLogoutLog(logUuid);
        }
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true, "message", "로그아웃 완료"));
    }
}
