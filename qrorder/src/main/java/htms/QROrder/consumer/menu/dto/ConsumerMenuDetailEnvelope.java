package htms.QROrder.consumer.menu.dto;

import lombok.Data;

@Data
public class ConsumerMenuDetailEnvelope {
    private boolean success;
    private String message;
    private String error;
    private ConsumerMenuDetailResponse data;
}
