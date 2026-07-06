package htms.QROrder.common.service;

import htms.QROrder.audit.dto.EmailLog;
import htms.QROrder.audit.service.EmailLogService;
import htms.QROrder.common.dto.EmailRequest;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final JavaMailSender mailSender;
    private final EmailLogService emailLogService;

    @Value("${spring.mail.username}")
    private String fromAddress;

    public void sendEmail(EmailRequest emailRequest, String userId, String sysPlantCd) {

        List<String> toList = emailRequest.getTo();

        if (toList == null || toList.isEmpty()) {
            throw new IllegalArgumentException("수신자(to)는 최소 1명 이상이어야 합니다.");
        }

        toList.forEach(to -> {
            if (!EMAIL_PATTERN.matcher(to).matches()) {
                throw new IllegalArgumentException("유효하지 않은 이메일 주소입니다: " + to);
            }
        });

        String toStr = joinEmails(toList);

        List<String> ccList = emailRequest.getCc();
        String ccStr = (ccList != null && !ccList.isEmpty()) ? joinEmails(ccList) : null;

        EmailLog emailLog = new EmailLog();
        emailLog.setEmailTo(toStr);
        emailLog.setEmailCc(ccStr);
        emailLog.setSubject(emailRequest.getSubject());
        emailLog.setBody(emailRequest.getBody());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress, "QR Order");
            helper.setTo(toList.toArray(new String[0]));
            if (ccStr != null) {
                helper.setCc(ccList.toArray(new String[0]));
            }
            helper.setSubject(emailRequest.getSubject());
            helper.setText(emailRequest.getBody());

            mailSender.send(message);
            emailLog.setSuccessStatus("S");
        } catch (Exception e) {
            emailLog.setSuccessStatus("F");
            emailLogService.emailSendLog(emailLog, userId, sysPlantCd);
            throw new RuntimeException("메일 발송에 실패하였습니다.");
        }

        emailLogService.emailSendLog(emailLog, userId, sysPlantCd);
    }

    private String joinEmails(List<String> emails) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < emails.size(); i++) {
            sb.append(emails.get(i));
            if (i < emails.size() - 1) {
                sb.append(",");
            }
        }
        return sb.toString();
    }
}
