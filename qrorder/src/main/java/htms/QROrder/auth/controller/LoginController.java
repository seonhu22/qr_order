package htms.QROrder.auth.controller;

import htms.QROrder.auth.dto.InitPwdRequest;
import htms.QROrder.auth.dto.LoginRequest;
import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.auth.service.LoginService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class LoginController {
    private final LoginService loginService;

    @PostMapping("/login")
    public ResponseEntity<CommonResponse> login(@RequestBody @Valid LoginRequest loginRequest,
                                                                HttpServletRequest request,
                                                                HttpSession session) {

        try {
            loginService.loginCheck(loginRequest, request, session);

            return ResponseEntity.ok(
                    CommonResponse.builder()
                            .success(true)
                            .message("로그인 성공")
                            .build()
            );
        } catch (LoginFailException e) {
            return ResponseEntity.status(401).body(
                    CommonResponse.builder()
                            .success(false)
                            .message(e.getMessage())
                            .build()
            );
        }
    }

    @PostMapping("/init-pwd")
    public ResponseEntity<CommonResponse> initPwd(@RequestBody @Valid InitPwdRequest initPwdRequest,
                                                        @RequestParam String userId) {

        loginService.initPwd(initPwdRequest, userId);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("비밀번호 초기화 완료.")
                        .build()
        );
    }
}
