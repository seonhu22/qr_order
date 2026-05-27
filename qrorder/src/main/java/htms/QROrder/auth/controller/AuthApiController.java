package htms.QROrder.auth.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.LoginResponse;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthApiController {

    @GetMapping("/me")
    public ResponseEntity<CommonResponse> getCurrentUser(HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        if (loginUser == null) {
            return ResponseEntity.status(401).body(
                    CommonResponse.builder()
                            .success(false)
                            .message("인증되지 않은 사용자")
                            .build()
            );
        }

        LoginResponse meResponse = LoginResponse.builder()
                .userId(loginUser.getUserId())
                .userName(loginUser.getUserNm())
                .sysPlantCd(loginUser.getSysPlantCd())
                .initPwdRequired(loginUser.getInitYn().equals("Y"))
                .build();

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .data(meResponse)
                        .build()
        );
    }
}
