package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderTotalPriceItem {
    private String linkSysId;
    private Integer totalPrice;
}
