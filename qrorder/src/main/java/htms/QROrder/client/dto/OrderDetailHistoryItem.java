package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderDetailHistoryItem {
    private String sysId;
    private String masterSysId;
    private String menuName;
    private Integer menuPrice;
    private String menuOption;
    private String orderDatetime;
}
