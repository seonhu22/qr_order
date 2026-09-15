package htms.QROrder.client.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
public class OrderDetailHistoryItem {
    private String sysId;
    private String masterSysId;
    private String menuName;
    private Integer menuPrice;
    private String menuOption;
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private String orderDatetime;
}
