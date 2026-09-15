package htms.QROrder.consumer.order.repository.row;

import lombok.Data;

@Data
public class ConsumerOrderOptionRow {
    private String orderItemId;
    private String optionSysId;
    private String optionName;
    private Integer storedQuantity;
    private Integer unitAmount;
}
