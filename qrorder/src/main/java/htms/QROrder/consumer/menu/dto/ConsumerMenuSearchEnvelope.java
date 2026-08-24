package htms.QROrder.consumer.menu.dto;

import lombok.Data;

@Data
public class ConsumerMenuSearchEnvelope {
    private boolean success;
    private String message;
    private String error;
    private ConsumerMenuSearchResponse data;
}
