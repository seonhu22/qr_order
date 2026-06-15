package htms.QROrder.common.service;

import htms.QROrder.common.dto.EmailRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final JavaMailSender mailSender;

    public void sendEmail(EmailRequest emailRequest) {

        List<String> toList = emailRequest.getTo();

        if (toList == null || toList.isEmpty()) {
            throw new IllegalArgumentException("수신자(to)는 최소 1명 이상이어야 합니다.");
        }

        toList.forEach(to -> {
            if (!EMAIL_PATTERN.matcher(to).matches()) {
                throw new IllegalArgumentException("유효하지 않은 이메일 주소입니다: " + to);
            }
        });

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toList.toArray(new String[0]));

        List<String> ccList = emailRequest.getCc();
        if (ccList != null && !ccList.isEmpty()) {
            message.setCc(ccList.toArray(new String[0]));
        }

        message.setSubject(emailRequest.getSubject());
        message.setText(emailRequest.getBody());

        mailSender.send(message);
    }
}
