package htms.QROrder.consumer.order.repository.row;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConsumerOrderDetailHeaderRow {
    private String orderId;
    private Integer orderNumber;
    private String orderStatus;
    private LocalDateTime orderedAt;
    private LocalDateTime updatedAt;
}
