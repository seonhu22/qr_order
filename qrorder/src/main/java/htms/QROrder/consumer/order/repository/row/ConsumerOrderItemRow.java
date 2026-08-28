package htms.QROrder.consumer.order.repository.row;

import lombok.Data;

@Data
public class ConsumerOrderItemRow {
    private String orderItemId;
    private String menuSysId;
    private String menuName;
    private Integer quantity;
    private Integer menuUnitAmount;
}
