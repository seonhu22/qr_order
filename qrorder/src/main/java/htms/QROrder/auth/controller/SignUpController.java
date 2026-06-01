package htms.QROrder.auth.controller;

import htms.QROrder.auth.dto.InitPwdRequest;
import htms.QROrder.auth.dto.LoginRequest;
import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.exception.LoginFailException;
import htms.QROrder.auth.service.LoginService;
import htms.QROrder.auth.service.SignUpService;
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
public class SignUpController {

    private final SignUpService signUpService;

    @GetMapping("/signup/new")
    public ResponseEntity<CommonResponse> newUser(@RequestBody SignUpRequest signUpRequest){

        signUpService.newUser(signUpRequest);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("회원가입 완료.")
                        .build()
        );
    }
}
