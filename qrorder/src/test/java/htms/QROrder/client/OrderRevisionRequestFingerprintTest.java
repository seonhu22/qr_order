package htms.QROrder.client;

import htms.QROrder.client.dto.OrderRevisionRequest;
import htms.QROrder.client.service.OrderRevisionRequestFingerprint;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateOptionRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

class OrderRevisionRequestFingerprintTest {
    @Test
    void canonicalFingerprintIgnoresListOrderAndWhitespace() {
        OrderRevisionRequest left = request(" A ", List.of("G2", "G1"), List.of("D2", "D1"),
                List.of(item("M2", 1, option("O2", 2)), item("M1", 2, option("O1", 1))));
        OrderRevisionRequest right = request("B", List.of("G1", "G2"), List.of("D1", "D2"),
                List.of(item(" M1 ", 2, option("O1", 1)), item("M2", 1, option("O2", 2))));

        assertEquals(OrderRevisionRequestFingerprint.create(left), OrderRevisionRequestFingerprint.create(right));
    }

    @Test
    void fingerprintChangesWhenPayloadChanges() {
        OrderRevisionRequest left = request("A", List.of("G1"), List.of(), List.of(item("M1", 1)));
        OrderRevisionRequest right = request("A", List.of("G1"), List.of(), List.of(item("M1", 2)));
        assertNotEquals(OrderRevisionRequestFingerprint.create(left), OrderRevisionRequestFingerprint.create(right));
    }

    @Test
    void structuralComparatorHandlesDelimiterLikeCharactersWithoutDependingOnToString() {
        OrderRevisionRequest left = request("A", List.of("G:1"), List.of("D,1"),
                List.of(item("M[1]", 1, option("O=2", 2), option("O:1", 1))));
        OrderRevisionRequest right = request("B", List.of("G:1"), List.of("D,1"),
                List.of(item("M[1]", 1, option("O:1", 1), option("O=2", 2))));
        assertEquals(OrderRevisionRequestFingerprint.create(left), OrderRevisionRequestFingerprint.create(right));
    }

    private OrderRevisionRequest request(String requestId, List<String> groups, List<String> details,
                                         List<ConsumerOrderCreateItemRequest> items) {
        OrderRevisionRequest request = new OrderRevisionRequest();
        request.setClientRequestId(requestId);
        request.setOrderGroupIds(groups);
        request.setRemoveDetailIds(details);
        request.setAddedItems(items);
        return request;
    }

    private ConsumerOrderCreateItemRequest item(String id, int quantity, ConsumerOrderCreateOptionRequest... options) {
        ConsumerOrderCreateItemRequest item = new ConsumerOrderCreateItemRequest();
        item.setMenuSysId(id); item.setQuantity(quantity); item.setOptions(List.of(options));
        return item;
    }

    private ConsumerOrderCreateOptionRequest option(String id, int quantity) {
        ConsumerOrderCreateOptionRequest option = new ConsumerOrderCreateOptionRequest();
        option.setOptionSysId(id); option.setQuantity(quantity); return option;
    }
}
