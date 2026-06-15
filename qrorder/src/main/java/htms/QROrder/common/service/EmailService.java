package htms.QROrder.common.service;

import htms.QROrder.common.dto.EmailRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final JavaMailSender mailSender;

    public void sendEmail(EmailRequest emailRequest) {

        if (!EMAIL_PATTERN.matcher(emailRequest.getTo()).matches()) {
            throw new IllegalArgumentException("유효하지 않은 이메일 주소입니다: " + emailRequest.getTo());
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(emailRequest.getTo());

        if (emailRequest.getCc() != null && !emailRequest.getCc().isBlank()) {
            message.setCc(emailRequest.getCc());
        }

        message.setSubject(emailRequest.getSubject());
        message.setText(emailRequest.getBody());

        mailSender.send(message);
    }
}
