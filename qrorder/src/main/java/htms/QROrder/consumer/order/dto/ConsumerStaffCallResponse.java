package htms.QROrder.consumer.order.dto;

import lombok.Data;

@Data
public class ConsumerStaffCallResponse {
    private String sysId;
    private String callCd;
    private String callNm;
    private String description;
    private String readYn;
}
