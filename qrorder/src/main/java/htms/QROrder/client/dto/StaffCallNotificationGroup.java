package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class StaffCallNotificationGroup {
    private String masterSysId;
    private String tableSysId;
    private Integer tableNum;
    private LocalDateTime insertDatetime;
    private List<StaffCallNotificationItem> items = new ArrayList<>();
}
