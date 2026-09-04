package htms.QROrder.consumer.order.repository.row;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConsumerOrderIdempotencyRow {
    private String orderId;
    private int orderNum;
    private String orderStatus;
    private int totalAmount;
    private LocalDateTime orderedAt;
}
