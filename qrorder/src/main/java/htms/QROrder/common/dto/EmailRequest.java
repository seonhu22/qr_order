package htms.QROrder.common.dto;

import lombok.Data;

import java.util.List;

@Data
public class EmailRequest {
    private List<String> to;
    private List<String> cc;
    private String subject;
    private String body;
}
