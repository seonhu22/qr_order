package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderMasterHistoryItem {
    private String sysId;
    private String linkSysId;
    private String tableNum;
    private String orderStatus;
    private String orderStatusNm;
    private Integer totalPrice;
    private LocalDateTime orderStartDatetime;
}
