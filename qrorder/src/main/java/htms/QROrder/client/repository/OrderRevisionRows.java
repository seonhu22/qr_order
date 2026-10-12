package htms.QROrder.client.repository;

import lombok.Data;
import lombok.Value;

import java.time.LocalDateTime;

public final class OrderRevisionRows {
    private OrderRevisionRows() {}

    @Data
    public static class Target {
        private String orderGroupId;
        private String orderMasterId;
        private String tableSysId;
        private String orderStatus;
        private String masterStatus;
    }

    @Data
    public static class Revision {
        private String revisionId;
        private String requestFingerprint;
        private String processingStatus;
        private String responseJson;
    }

    @Value
    public static class Group {
        String orderId;
        String orderMasterId;
        String sysPlantCd;
        int orderNumber;
        String userId;
        LocalDateTime orderedAt;
    }

    @Value
    public static class Item {
        String orderItemId;
        String orderMasterId;
        String orderId;
        String menuSysId;
        String sysPlantCd;
        int quantity;
        boolean hasOptions;
        String userId;
        LocalDateTime orderedAt;
    }

    @Value
    public static class Option {
        String orderOptionId;
        String orderItemId;
        String optionSysId;
        String sysPlantCd;
        int quantity;
        String userId;
        LocalDateTime orderedAt;
    }
}
