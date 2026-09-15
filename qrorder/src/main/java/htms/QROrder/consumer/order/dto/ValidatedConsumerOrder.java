package htms.QROrder.consumer.order.dto;

import java.util.List;

public record ValidatedConsumerOrder(
        String clientRequestId,
        List<Item> items,
        int totalAmount
) {
    public record Item(
            String menuSysId,
            int quantity,
            int menuUnitAmount,
            int unitAmount,
            int lineAmount,
            List<Option> options
    ) {
    }

    public record Option(
            String optionSysId,
            int quantity,
            int storedQuantity,
            int unitAmount,
            int lineAmount
    ) {
    }
}
