package htms.QROrder.auth.controller;

import htms.QROrder.auth.domain.Login;
import htms.QROrder.auth.dto.EmailValidRequest;
import htms.QROrder.auth.exception.EmailValidException;
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

    @PostMapping("/email_valid/new_user/send")
    public ResponseEntity<CommonResponse> sendUserEmailValid(@RequestBody EmailValidRequest emailValidRequest,
                                                                HttpSession session) {

        session.removeAttribute("signupEmail");
        session.removeAttribute("signupValidCode");

        String validCode = emailValidService.sendUserEmailValid(emailValidRequest.getEmail(), "SIGNUP", "SIGNUP");
        session.setAttribute("signupEmail", emailValidRequest.getEmail());
        session.setAttribute("signupValidCode", validCode);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("인증 코드가 발송되었습니다.")
                        .build()
        );
    }

    @PostMapping("/email_valid/new_user/re_send")
    public ResponseEntity<CommonResponse> reSendUserEmailValid(@RequestBody EmailValidRequest emailValidRequest,
                                                                HttpSession session) {

        session.removeAttribute("signupEmail");
        session.removeAttribute("signupValidCode");

        String validCode = emailValidService.sendUserEmailValid(emailValidRequest.getEmail(), "SIGNUP", "SIGNUP");
        session.setAttribute("signupEmail", emailValidRequest.getEmail());
        session.setAttribute("signupValidCode", validCode);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("인증 코드가 재발송되었습니다.")
                        .build()
        );
    }

    @PostMapping("/email_valid/pwd_change/send")
    public ResponseEntity<CommonResponse> sendPwdChangeCode(@RequestBody EmailValidRequest emailValidRequest,
                                                                HttpSession session) {

        session.removeAttribute("pwdChangeEmail");
        session.removeAttribute("pwdChangeValidCode");

        String validCode = emailValidService.sendPwdChangeCode(emailValidRequest.getEmail(), emailValidRequest.getUserId(), "CHGPWD");
        session.setAttribute("pwdChangeEmail", emailValidRequest.getEmail());
        session.setAttribute("pwdChangeValidCode", validCode);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("인증 코드가 발송되었습니다.")
                        .build()
        );
    }

    @PostMapping("/email_valid/pwd_change/re_send")
    public ResponseEntity<CommonResponse> reSendPwdChangeCode(@RequestBody EmailValidRequest emailValidRequest,
                                                            HttpSession session) {

        session.removeAttribute("pwdChangeEmail");
        session.removeAttribute("pwdChangeValidCode");

        Login loginUser = (Login) session.getAttribute("loginUser");

        String validCode = emailValidService.sendPwdChangeCode(emailValidRequest.getEmail(), loginUser.getUserId(), loginUser.getSysPlantCd());
        session.setAttribute("pwdChangeEmail", emailValidRequest.getEmail());
        session.setAttribute("pwdChangeValidCode", validCode);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("인증 코드가 재발송되었습니다.")
                        .build()
        );
    }

    @PostMapping("/email_valid/pwd_change")
    public ResponseEntity<CommonResponse> pwdChange(@RequestBody EmailValidRequest emailValidRequest,
                                                        HttpSession session) {

        String sessionEmail = (String) session.getAttribute("pwdChangeEmail");
        String sessionCode = (String) session.getAttribute("pwdChangeValidCode");

        if (sessionEmail == null
                || !sessionEmail.equals(emailValidRequest.getEmail())
                || !sessionCode.equals(emailValidRequest.getValidCode())) {
            throw new EmailValidException("인증 코드가 일치하지 않습니다.");
        }

        session.removeAttribute("pwdChangeEmail");
        session.removeAttribute("pwdChangeValidCode");
        session.setAttribute("pwdChangeVerified", true);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("이메일 인증 완료.")
                        .build()
        );
    }
}
