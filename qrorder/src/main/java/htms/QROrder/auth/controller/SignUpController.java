package htms.QROrder.auth.controller;

import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.service.SignUpService;
import htms.QROrder.common.dto.CommonResponse;
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

    @PostMapping("/signup/new")
    public ResponseEntity<CommonResponse> newUser(@RequestBody SignUpRequest signUpRequest){

        signUpService.newUser(signUpRequest);

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

    @PostMapping("/signup/email_valid/{encodeSysId}")
    public ResponseEntity<CommonResponse> emailValid(@PathVariable String encodeSysId){

        signUpService.emailValid(encodeSysId);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("이메일 인증 완료.")
                        .build()
        );
    }
}
