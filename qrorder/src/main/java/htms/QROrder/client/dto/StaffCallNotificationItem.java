package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StaffCallNotificationItem {
    private String sysId;
    private String callCd;
    private String callNm;
    private String description;
    private LocalDateTime insertDatetime;
}
