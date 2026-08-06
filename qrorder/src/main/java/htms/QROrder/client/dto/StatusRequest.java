package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class StatusRequest extends StatusItem {
    private String cancelReason;
    private String cancelDescription;
    private String cancelDatetime;
}
