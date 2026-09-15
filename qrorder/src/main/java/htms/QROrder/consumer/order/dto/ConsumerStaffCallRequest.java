package htms.QROrder.consumer.order.dto;

import lombok.Data;

@Data
public class ConsumerStaffCallRequest {
    private String sysId;
    private String callCd;
    private String description;
}
