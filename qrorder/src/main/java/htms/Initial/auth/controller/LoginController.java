package htms.Initial.auth.controller;

import htms.Initial.auth.domain.Login;
import htms.Initial.auth.exception.LoginFailException;
import htms.Initial.auth.service.LoginService;
import htms.Initial.auth.dto.InitPwdRequest;
import htms.Initial.common.dto.CommonResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class LoginController {
    private final LoginService loginService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Login login,
                                                     HttpServletRequest request,
                                                     HttpSession session) {
        try {
            boolean initPwdRequired = loginService.loginCheck(login, request, session);
            Login loginUser = (Login) session.getAttribute("loginUser");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "로그인 성공",
                    "initPwdRequired", initPwdRequired,
                    "user", Map.of(
                            "userId", loginUser.getUserId(),
                            "userName", loginUser.getUserName(),
                            "deptNm", loginUser.getDeptNm() != null ? loginUser.getDeptNm() : "",
                            "sysPlantCd", loginUser.getSysPlantCd() != null ? loginUser.getSysPlantCd() : ""
                    )
            ));
        } catch (LoginFailException e) {
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/init-pwd")
    public ResponseEntity<CommonResponse> initPwd(@RequestBody @Valid InitPwdRequest initPwdRequest,
                                                  @RequestParam String userId) {
        loginService.initPwd(initPwdRequest, userId);
        return ResponseEntity.ok(CommonResponse.builder()
                .success(true)
                .message("비밀번호 초기화 완료.")
                .build());
    }
}
