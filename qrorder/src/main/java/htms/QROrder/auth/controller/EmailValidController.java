package htms.QROrder.auth.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.EmailValidRequest;
import htms.QROrder.auth.service.EmailValidService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class EmailValidController {

    private final EmailValidService emailValidService;

    @PostMapping("/email_valid/new_user")
    public ResponseEntity<CommonResponse> newUserEmailValid(@RequestBody EmailValidRequest emailValidRequest) {

        emailValidService.newUserEmailValid(emailValidRequest.getEmail(), emailValidRequest.getValidCode());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("이메일 인증 완료.")
                        .build()
        );
    }

    @PostMapping("/email_valid/pwd_change/send")
    public ResponseEntity<CommonResponse> sendPwdChangeCode(@RequestBody EmailValidRequest emailValidRequest,
                                                                HttpSession session) {

        Login loginUser = (Login) session.getAttribute("loginUser");

        emailValidService.sendPwdChangeCode(emailValidRequest.getEmail(), loginUser.getUserId(), loginUser.getSysPlantCd());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("인증 코드가 발송되었습니다.")
                        .build()
        );
    }

    @PostMapping("/email_valid/pwd_change")
    public ResponseEntity<CommonResponse> pwdChange(@RequestBody EmailValidRequest emailValidRequest) {

        emailValidService.pwdChange(emailValidRequest.getEmail(), emailValidRequest.getValidCode());

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("이메일 인증 완료.")
                        .build()
        );
    }
}
