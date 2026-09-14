package htms.QROrder.consumer.order.repository.row;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConsumerOrderSummaryRow {
    private String orderId;
    private Integer orderNumber;
    private String orderStatus;
    private Long totalAmount;
    private Long itemCount;
    private LocalDateTime orderedAt;
    private LocalDateTime updatedAt;
}
