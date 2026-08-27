package htms.QROrder.consumer.session.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConsumerVisitRecord {
    private String consumerSessionId;
    private String tableSysId;
    private String sysPlantCd;
    private String orderStatus;
    private LocalDateTime startedAt;
    private LocalDateTime lastActivityAt;
    private boolean hasOrders;
    private boolean expired;
}
