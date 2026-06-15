package htms.QROrder.auth.service;

import htms.QROrder.auth.exception.EmailValidException;
import htms.QROrder.auth.repository.EmailValidMapper;
import htms.QROrder.common.dto.EmailRequest;
import htms.QROrder.common.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailValidService {

    private final EmailValidMapper emailValidMapper;
    private final EmailService emailService;

    public String sendSignupCode(String email, String userName) {

        String validCode = generateValidCode();

        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo(List.of(email));
        emailRequest.setSubject("[QROrder] 이메일 인증");
        emailRequest.setBody("안녕하세요, " + userName + "님.\n\n" +
                "아래 인증 코드를 입력해주세요.\n\n" +
                "인증 코드: " + validCode + "\n\n" +
                "본 메일은 발신 전용입니다.");
        emailService.sendEmail(emailRequest);

        return validCode;
    }

    public void newUserEmailValid(String email, String validCode) {

        if (!emailValidMapper.codeExist(email)) {
            throw new EmailValidException("인증 정보가 유효하지 않습니다.");
        }

        if (!emailValidMapper.codeMatch(email, validCode)) {
            throw new EmailValidException("인증 코드가 일치하지 않습니다.");
        }

        emailValidMapper.newUserEmailValid(email);
    }

    public void sendPwdChangeCode(String email) {

        if (!emailValidMapper.userExistsByEmail(email)) {
            throw new EmailValidException("존재하지 않는 이메일입니다.");
        }

        String validCode = generateValidCode();
        emailValidMapper.updateValidCode(email, validCode);

        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo(List.of(email));
        emailRequest.setSubject("[QROrder] 비밀번호 재설정 인증");
        emailRequest.setBody("아래 인증 코드를 입력해주세요.\n\n" +
                "인증 코드: " + validCode + "\n\n" +
                "본 메일은 발신 전용입니다.");
        emailService.sendEmail(emailRequest);
    }

    public void pwdChange(String email, String validCode) {

        if (!emailValidMapper.codeExist(email)) {
            throw new EmailValidException("인증 정보가 유효하지 않습니다.");
        }

        if (!emailValidMapper.codeMatch(email, validCode)) {
            throw new EmailValidException("인증 코드가 일치하지 않습니다.");
        }

        emailValidMapper.pwdChange(email);
    }

    private String generateValidCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
