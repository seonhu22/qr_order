package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class StatusFooterItem {
    private String sysId;
    private Integer totalPrice;
}
