package htms.QROrder.consumer.order.dto;

import lombok.Data;

import java.util.List;

@Data
public class ConsumerStaffCallRequest {
    private List<Item> items;

    @Data
    public static class Item {
        private String callCd;
        private Integer quantity;
    }
}
