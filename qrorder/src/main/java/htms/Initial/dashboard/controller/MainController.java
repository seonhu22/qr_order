package htms.Initial.dashboard.controller;

import htms.Initial.auth.domain.Login;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/dashboard")
public class MainController {

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getDashboardInfo(HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");
        return ResponseEntity.ok(Map.of(
                "success", true,
                "userName", loginUser.getUserName()
        ));
    }
}
