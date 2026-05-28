package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class PaymentCompleteResponse {
    private PaymentCompleteHeaderItem header;
    private List<PaymentCompleteBodyItem> body;
    private PaymentCompleteFooterItem footer;
}
