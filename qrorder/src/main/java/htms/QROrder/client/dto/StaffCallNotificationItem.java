package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StaffCallNotificationItem {
    private String masterSysId;
    private String sysId;
    private String callCd;
    private String callNm;
    private String description;
    private Integer quantity;
    private LocalDateTime insertDatetime;
}
