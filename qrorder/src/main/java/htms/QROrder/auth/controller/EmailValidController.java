package htms.QROrder.auth.controller;

import htms.QROrder.auth.dto.BRNRequest;
import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.service.EmailValidService;
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
public class EmailValidController {

    private final EmailValidService emailValidService;

    @PostMapping("/email_valid/{encodeSysId")
    public ResponseEntity<CommonResponse> emailValid(@PathVariable String encodeSysId){

        emailValidService.emailValid(encodeSysId);

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("이메일 인증 완료.")
                        .build()
        );
    }
}
