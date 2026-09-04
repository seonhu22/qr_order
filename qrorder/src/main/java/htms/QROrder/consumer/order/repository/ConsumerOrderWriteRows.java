package htms.QROrder.consumer.order.repository;

import lombok.Value;

import java.time.LocalDateTime;

public final class ConsumerOrderWriteRows {
    private ConsumerOrderWriteRows() {
    }

    @Value
    public static class Group {
        String orderId;
        String consumerSessionId;
        String sysPlantCd;
        int orderNumber;
        LocalDateTime orderedAt;
    }

    @Value
    public static class Item {
        String orderItemId;
        String consumerSessionId;
        String orderId;
        String menuSysId;
        String sysPlantCd;
        int quantity;
        boolean hasOptions;
        LocalDateTime orderedAt;
    }

    @Value
    public static class Option {
        String orderOptionId;
        String orderItemId;
        String optionSysId;
        String sysPlantCd;
        int quantity;
        LocalDateTime orderedAt;
    }

    @Value
    public static class Idempotency {
        String clientRequestId;
        String sysPlantCd;
        String orderId;
        int orderNum;
        String orderStatus;
        int totalAmount;
        LocalDateTime orderedAt;
    }
}
