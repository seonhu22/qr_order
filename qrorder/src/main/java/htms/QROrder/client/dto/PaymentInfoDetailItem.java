package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class PaymentInfoDetailItem {
    private String sysId;
    private Integer orderNum;
    private String items;
    private String orderStatus;
    private String cancelReason;
    private String cancelDescription;
}