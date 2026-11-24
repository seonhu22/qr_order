package htms.QROrder.auth.controller;

import htms.QROrder.auth.dto.SignUpRequest;
import htms.QROrder.auth.dto.VerifiedBusiness;
import htms.QROrder.auth.exception.BusinessRegiException;
import htms.QROrder.auth.exception.EmailValidException;
import htms.QROrder.auth.service.SignUpService;
import htms.QROrder.common.dto.CommonResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.WebUtils;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class SignUpController {

    private final SignUpService signUpService;

    @PostMapping("/signup/new/chkBRN")
    public ResponseEntity<CommonResponse> chkBRN(@RequestBody SignUpRequest signUpRequest,
                                                 HttpSession session){

        // 인증값 저장/폐기와 가입의 확인/소모는 같은 세션 뮤텍스 안에서만 한다. NTS 호출은 뮤텍스 밖.
        Object mutex = WebUtils.getSessionMutex(session);
        synchronized (mutex) {
            session.removeAttribute(VerifiedBusiness.SESSION_KEY);
        }
        signUpService.chkBRN(signUpRequest);
        synchronized (mutex) {
            session.setAttribute(VerifiedBusiness.SESSION_KEY, VerifiedBusiness.of(signUpRequest));
        }

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

        // 일치한 인증은 DB 호출 전에 소모한다. 같은 세션의 동시 가입은 하나만 서비스까지 간다.
        synchronized (WebUtils.getSessionMutex(session)) {
            Object verified = session.getAttribute(VerifiedBusiness.SESSION_KEY);
            if (!(verified instanceof VerifiedBusiness business) || !business.matches(signUpRequest)) {
                throw new BusinessRegiException("사업자 인증을 먼저 완료해주세요.");
            }
            session.removeAttribute(VerifiedBusiness.SESSION_KEY);
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
