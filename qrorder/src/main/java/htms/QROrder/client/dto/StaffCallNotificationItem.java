package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class StaffCallNotificationItem {
    private String sysId;
    private String callCd;
    private String callNm;
    private String description;
    private Integer quantity;
}
