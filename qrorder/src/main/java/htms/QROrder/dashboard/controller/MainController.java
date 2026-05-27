package htms.QROrder.dashboard.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class MainController {

    @GetMapping("/info")
    public ResponseEntity<CommonResponse> getDashboardInfo(HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        return ResponseEntity.ok(
                CommonResponse.<String>builder()
                        .success(true)
                        .build()
        );
    }
}
