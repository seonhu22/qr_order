package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class StatusCancelResponse {
    private String cancelReason;
    private String cancelDescription;
}
