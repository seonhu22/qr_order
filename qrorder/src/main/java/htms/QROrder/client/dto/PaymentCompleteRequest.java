package htms.QROrder.client.dto;

import lombok.Data;

import java.util.List;

@Data
public class PaymentCompleteRequest {
    private String paymentType;
    private PaymentCompleteResponse.Header header;
    private List<PaymentCompleteResponse.Body> body;
    private PaymentCompleteResponse.Footer footer;
}
