package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class StatusHeaderItem {
    private String sysId;
    private Integer orderNum;
    private Integer tableNum;
    private LocalDateTime orderDatetime;
    private String orderStatus;
}
