package htms.QROrder.consumer.menu.dto;

import lombok.Data;

@Data
public class ConsumerMenuMainEnvelope {
    private boolean success;
    private String message;
    private String error;
    private ConsumerMenuMainResponse data;
}
