package htms.QROrder.consumer.order.idempotency;

import htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateOptionRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class ConsumerOrderRequestFingerprintTest {

    @Test
    void ignoresItemAndOptionOrderButIncludesQuantities() {
        ConsumerOrderCreateRequest first = request(List.of(
                item("MENU-2", 1, option("OPTION-2", 1), option("OPTION-1", 2)),
                item("MENU-1", 3)));
        ConsumerOrderCreateRequest reordered = request(List.of(
                item("MENU-1", 3),
                item("MENU-2", 1, option("OPTION-1", 2), option("OPTION-2", 1))));
        ConsumerOrderCreateRequest changedQuantity = request(List.of(
                item("MENU-1", 3),
                item("MENU-2", 2, option("OPTION-1", 2), option("OPTION-2", 1))));

        assertEquals(
                ConsumerOrderRequestFingerprint.create(first),
                ConsumerOrderRequestFingerprint.create(reordered));
        assertNotEquals(
                ConsumerOrderRequestFingerprint.create(first),
                ConsumerOrderRequestFingerprint.create(changedQuantity));
    }

    @Test
    void normalizesSurroundingWhitespaceAndNullCollections() {
        ConsumerOrderCreateRequest first = request(List.of(item(" MENU-1 ", 1)));
        first.setRequestNote("   ");
        ConsumerOrderCreateRequest second = request(List.of(item("MENU-1", 1)));
        second.setRequestNote(null);

        assertEquals(
                ConsumerOrderRequestFingerprint.create(first),
                ConsumerOrderRequestFingerprint.create(second));
    }

    private ConsumerOrderCreateRequest request(List<ConsumerOrderCreateItemRequest> items) {
        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();
        request.setClientRequestId("ignored-by-fingerprint");
        request.setItems(items);
        return request;
    }

    private ConsumerOrderCreateItemRequest item(
            String menuSysId,
            int quantity,
            ConsumerOrderCreateOptionRequest... options) {
        ConsumerOrderCreateItemRequest item = new ConsumerOrderCreateItemRequest();
        item.setMenuSysId(menuSysId);
        item.setQuantity(quantity);
        item.setOptions(options.length == 0 ? null : List.of(options));
        return item;
    }

    private ConsumerOrderCreateOptionRequest option(String optionSysId, int quantity) {
        ConsumerOrderCreateOptionRequest option = new ConsumerOrderCreateOptionRequest();
        option.setOptionSysId(optionSysId);
        option.setQuantity(quantity);
        return option;
    }
}
