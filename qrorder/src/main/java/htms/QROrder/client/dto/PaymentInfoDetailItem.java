package htms.QROrder.client.dto;

import lombok.Data;

@Data
public class PaymentInfoDetailItem {
    private Integer treeLevel;
    private String sysId;
    private String parentSysId;
    private String itemName;
    private Integer qty;
    private Integer price;
    private Integer totalPrice;
    private String paymentYn;
    private String orderStatus;
    private String cancelReason;
    private String cancelDescription;
}