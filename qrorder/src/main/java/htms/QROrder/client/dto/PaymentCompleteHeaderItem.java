package htms.QROrder.client.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentCompleteHeaderItem {
    private String sysId;
    private String tableInfo;
    private LocalDateTime orderDatetime;
}
