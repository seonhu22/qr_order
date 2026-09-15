package htms.QROrder.auth.controller;

import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.exception.EmailValidException;
import htms.QROrder.auth.service.SignUpService;
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
public class SignUpController {

    private final SignUpService signUpService;

    @PostMapping("/signup/new/chkBRN")
    public ResponseEntity<CommonResponse> chkBRN(@RequestBody SignUpRequest signUpRequest){

        signUpService.chkBRN(signUpRequest);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("사업자 인증 완료.")
                        .build()
        );
    }

    @GetMapping("/signup/new/chkEmailValid")
    public boolean chkEmailValid(@RequestParam String email,
                                    @RequestParam String validCode,
                                    HttpSession session){

        String sessionEmail = (String) session.getAttribute("signupEmail");
        String sessionCode = (String) session.getAttribute("signupValidCode");

        return sessionEmail != null
                && sessionEmail.equals(email)
                && validCode.equals(sessionCode);
    }

    @PostMapping("/signup/new")
    public ResponseEntity<CommonResponse> newUser(@RequestBody SignUpRequest signUpRequest,
                                                    HttpSession session){

        String sessionEmail = (String) session.getAttribute("signupEmail");
        String sessionCode = (String) session.getAttribute("signupValidCode");

        if (sessionEmail == null
                || !sessionEmail.equals(signUpRequest.getEmail())
                || !sessionCode.equals(signUpRequest.getValidCode())) {
            throw new EmailValidException("이메일 인증을 먼저 완료해주세요.");
        }

        signUpService.newUser(signUpRequest);

        session.removeAttribute("signupEmail");
        session.removeAttribute("signupValidCode");

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("회원가입 완료.")
                        .build()
        );
    }

    @GetMapping("/signup/idDuplicateChk")
    public boolean idDuplicateChk(@RequestParam String userId) {

        return signUpService.idDuplicateChk(userId);
    }
}
