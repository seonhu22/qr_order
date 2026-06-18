package htms.QROrder.audit.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EmailLog {
    private String sysId;
    private String successStatus;
    private String emailTo;
    private String emailCc;
    private String subject;
    private String body;
}
