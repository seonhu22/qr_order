package htms.QROrder.auth.controller;

import htms.QROrder.auth.dto.PwdChgRequest;
import htms.QROrder.auth.exception.EmailValidException;
import htms.QROrder.auth.service.PwdChgService;
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
public class PwdChgController {

    private final PwdChgService pwdChgService;

    @PostMapping("/pwd_change")
    public ResponseEntity<CommonResponse> changePwd(@RequestBody PwdChgRequest pwdChgRequest,
                                                        HttpSession session) {

        Boolean verified = (Boolean) session.getAttribute("pwdChangeVerified");
        String verifiedUserId = (String) session.getAttribute("pwdChangeVerifiedUserId");

        if (!Boolean.TRUE.equals(verified) || verifiedUserId == null) {
            throw new EmailValidException("이메일 인증을 먼저 완료해주세요.");
        }
        if (!verifiedUserId.equals(pwdChgRequest.getUserId())) {
            throw new EmailValidException("인증된 사용자와 요청 사용자가 일치하지 않습니다.");
        }

        pwdChgService.changePwd(pwdChgRequest);

        session.removeAttribute("pwdChangeVerified");
        session.removeAttribute("pwdChangeVerifiedUserId");

        return ResponseEntity.ok(
                CommonResponse.builder()
                        .success(true)
                        .message("비밀번호가 초기화 되었습니다.")
                        .build()
        );
    }
}
