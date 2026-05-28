package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class PaymentNotCompleteRequest {
    private PaymentCompleteHeaderItem orderInfo;
    private String unpaidReason;
    private String unpaidDescription;
}
