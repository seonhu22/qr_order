package htms.QROrder.consumer.order;

import htms.QROrder.consumer.order.dto.ConsumerOrderDetailResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderListResponse;
import htms.QROrder.consumer.order.exception.ConsumerOrderNotFoundException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionRequiredException;
import htms.QROrder.consumer.order.repository.ConsumerOrderMapper;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderDetailHeaderRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderItemRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderOptionRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderSummaryRow;
import htms.QROrder.consumer.order.service.ConsumerOrderQueryService;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ConsumerOrderQueryServiceTest {

    private final ConsumerVisitService consumerVisitService = mock(ConsumerVisitService.class);
    private final ConsumerOrderMapper consumerOrderMapper = mock(ConsumerOrderMapper.class);
    private final ConsumerOrderQueryService service = new ConsumerOrderQueryService(
            consumerVisitService, new ConsumerOrderSessionGuard(), consumerOrderMapper);

    @Test
    void returnsOrdersFromCurrentSharedVisit() {
        QrConnectResponse qr = qrTableInfo();
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(consumerOrderMapper.findOrders("VISIT-1", "PLANT-1"))
                .thenReturn(List.of(summary("ORDER-2", 1002, "02", 18_000L, 2L)));

        ConsumerOrderListResponse response = service.getOrders(qr, binding());

        assertEquals(1, response.getOrders().size());
        assertEquals("ORDER-2", response.getOrders().get(0).getOrderId());
        assertEquals("1002", response.getOrders().get(0).getOrderNo());
        assertEquals("COOKING", response.getOrders().get(0).getStatus());
        assertEquals(18_000, response.getOrders().get(0).getTotalAmount());
        verify(consumerVisitService).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void assemblesDetailAmountsFromStoredOptionQuantity() {
        QrConnectResponse qr = qrTableInfo();
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(consumerOrderMapper.findOrderDetailHeader("VISIT-1", "PLANT-1", "ORDER-1"))
                .thenReturn(header("ORDER-1", 1001, "01"));
        when(consumerOrderMapper.findOrderItems("VISIT-1", "PLANT-1", "ORDER-1"))
                .thenReturn(List.of(item("ITEM-1", 2, 8_000)));
        when(consumerOrderMapper.findOrderOptions("VISIT-1", "PLANT-1", "ORDER-1"))
                .thenReturn(List.of(option("ITEM-1", 4, 500)));

        ConsumerOrderDetailResponse response = service.getOrder(qr, binding(), " ORDER-1 ");

        assertEquals(18_000, response.getTotalAmount());
        assertEquals(9_000, response.getItems().get(0).getUnitAmount());
        assertEquals(18_000, response.getItems().get(0).getLineAmount());
        assertEquals(2, response.getItems().get(0).getOptions().get(0).getQuantity());
        assertEquals(2_000, response.getItems().get(0).getOptions().get(0).getLineAmount());
        verify(consumerVisitService).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void hidesOrderOutsideCurrentVisitAsNotFound() {
        QrConnectResponse qr = qrTableInfo();
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(consumerOrderMapper.findOrderDetailHeader("VISIT-1", "PLANT-1", "ORDER-OTHER"))
                .thenReturn(null);

        assertThrows(ConsumerOrderNotFoundException.class,
                () -> service.getOrder(qr, binding(), "ORDER-OTHER"));
    }

    @Test
    void rejectsBindingFromDifferentTableBeforeQuery() {
        ConsumerSessionBinding otherTable = new ConsumerSessionBinding(
                "VISIT-1", "PLANT-1", "TABLE-OTHER", LocalDateTime.now());

        assertThrows(ConsumerOrderSessionRequiredException.class,
                () -> service.getOrders(qrTableInfo(), otherTable));

        verifyNoInteractions(consumerVisitService, consumerOrderMapper);
    }

    @Test
    void rejectsClosedVisitBeforeQuery() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerVisitRecord closed = activeVisit();
        closed.setOrderStatus("02");
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(closed);

        assertThrows(ConsumerOrderSessionGoneException.class,
                () -> service.getOrders(qr, binding()));

        verifyNoInteractions(consumerOrderMapper);
    }

    @Test
    void rejectsStoredOptionQuantityThatCannotBeConvertedToPerMenuQuantity() {
        QrConnectResponse qr = qrTableInfo();
        when(consumerVisitService.findBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(consumerOrderMapper.findOrderDetailHeader("VISIT-1", "PLANT-1", "ORDER-1"))
                .thenReturn(header("ORDER-1", 1001, "01"));
        when(consumerOrderMapper.findOrderItems("VISIT-1", "PLANT-1", "ORDER-1"))
                .thenReturn(List.of(item("ITEM-1", 2, 8_000)));
        when(consumerOrderMapper.findOrderOptions("VISIT-1", "PLANT-1", "ORDER-1"))
                .thenReturn(List.of(option("ITEM-1", 3, 500)));

        assertThrows(IllegalStateException.class,
                () -> service.getOrder(qr, binding(), "ORDER-1"));
    }

    private ConsumerOrderSummaryRow summary(
            String id, int number, String status, long total, long count) {
        ConsumerOrderSummaryRow row = new ConsumerOrderSummaryRow();
        row.setOrderId(id);
        row.setOrderNumber(number);
        row.setOrderStatus(status);
        row.setTotalAmount(total);
        row.setItemCount(count);
        row.setOrderedAt(LocalDateTime.now());
        row.setUpdatedAt(LocalDateTime.now());
        return row;
    }

    private ConsumerOrderDetailHeaderRow header(String id, int number, String status) {
        ConsumerOrderDetailHeaderRow row = new ConsumerOrderDetailHeaderRow();
        row.setOrderId(id);
        row.setOrderNumber(number);
        row.setOrderStatus(status);
        row.setOrderedAt(LocalDateTime.now());
        row.setUpdatedAt(LocalDateTime.now());
        return row;
    }

    private ConsumerOrderItemRow item(String id, int quantity, int menuPrice) {
        ConsumerOrderItemRow row = new ConsumerOrderItemRow();
        row.setOrderItemId(id);
        row.setMenuSysId("MENU-1");
        row.setMenuName("메뉴");
        row.setQuantity(quantity);
        row.setMenuUnitAmount(menuPrice);
        return row;
    }

    private ConsumerOrderOptionRow option(String itemId, int storedQuantity, int price) {
        ConsumerOrderOptionRow row = new ConsumerOrderOptionRow();
        row.setOrderItemId(itemId);
        row.setOptionSysId("OPTION-1");
        row.setOptionName("옵션");
        row.setStoredQuantity(storedQuantity);
        row.setUnitAmount(price);
        return row;
    }

    private QrConnectResponse qrTableInfo() {
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysId("TABLE-1");
        qr.setSysPlantCd("PLANT-1");
        return qr;
    }

    private ConsumerSessionBinding binding() {
        return new ConsumerSessionBinding(
                "VISIT-1", "PLANT-1", "TABLE-1", LocalDateTime.now());
    }

    private ConsumerVisitRecord activeVisit() {
        ConsumerVisitRecord visit = new ConsumerVisitRecord();
        visit.setConsumerSessionId("VISIT-1");
        visit.setOrderStatus("01");
        return visit;
    }
}
