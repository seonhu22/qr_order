package htms.QROrder.common.dto;

import lombok.Data;

@Data
public class EmailRequest {
    private String to;
    private String cc;
    private String subject;
    private String body;
}
