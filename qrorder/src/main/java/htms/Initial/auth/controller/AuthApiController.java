package htms.Initial.auth.controller;

import htms.Initial.auth.domain.Login;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthApiController {

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(HttpSession session) {
        Login loginUser = (Login) session.getAttribute("loginUser");
        if (loginUser == null) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "인증되지 않은 사용자"
            ));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "user", Map.of(
                        "userId", loginUser.getUserId(),
                        "userName", loginUser.getUserName(),
                        "deptNm", loginUser.getDeptNm() != null ? loginUser.getDeptNm() : "",
                        "sysPlantCd", loginUser.getSysPlantCd() != null ? loginUser.getSysPlantCd() : ""
                )
        ));
    }
}
