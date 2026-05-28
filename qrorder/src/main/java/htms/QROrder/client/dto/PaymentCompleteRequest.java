package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class PaymentCompleteRequest {
    private String paymentType;
    private PaymentCompleteHeaderItem header;
    private List<PaymentCompleteBodyItem> body;
    private PaymentCompleteFooterItem footer;
}
