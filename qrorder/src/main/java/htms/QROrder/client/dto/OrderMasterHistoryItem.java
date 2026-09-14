package htms.QROrder.client.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class OrderMasterHistoryItem {
    private String sysId;
    private String linkSysId;
    private String tableNum;
    private String orderNo;
    private String paymentStatus;
    private String orderStatus;
    private String orderStatusNm;
    private Integer totalPrice;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime orderStartDatetime;
}
