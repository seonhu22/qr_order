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

    public String sendUserEmailValid(String email,
                                        String userId,
                                        String sysPlantCd) {

        String validCode = generateValidCode();

        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo(List.of(email));
        emailRequest.setSubject("[QR Order] 이메일 인증 코드");
        emailRequest.setBody("QR Order 이메일 인증 요청으로 발송된 인증 코드입니다.\n\n" +
                "인증 코드: " + validCode + "\n\n" +
                "본인이 요청하지 않았다면 이 메일을 무시해주세요.\n" +
                "본 메일은 발신 전용입니다.");

        emailService.sendEmail(emailRequest, userId, sysPlantCd);

        return validCode;
    }

    public String sendPwdChangeCode(String email,
                                    String userId,
                                    String sysPlantCd) {

        if (!emailValidMapper.userEmailMatchChk(email, userId)) {
            throw new EmailValidException("아이디와 이메일이 일치하지 않습니다.");
        }

        String validCode = generateValidCode();

        EmailRequest emailRequest = new EmailRequest();
        emailRequest.setTo(List.of(email));
        emailRequest.setSubject("[QR Order] 비밀번호 재설정 인증 코드");
        emailRequest.setBody("QR Order 비밀번호 재설정 요청으로 발송된 인증 코드입니다.\n\n" +
                "인증 코드: " + validCode + "\n\n" +
                "본인이 요청하지 않았다면 이 메일을 무시해주세요.\n" +
                "본 메일은 발신 전용입니다.");
        emailService.sendEmail(emailRequest, userId, sysPlantCd);

        return validCode;
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
