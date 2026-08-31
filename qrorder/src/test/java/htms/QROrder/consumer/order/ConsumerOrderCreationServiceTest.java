package htms.QROrder.consumer.order;

import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.dto.ValidatedConsumerOrder;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionRequiredException;
import htms.QROrder.consumer.order.exception.ConsumerTableInactiveException;
import htms.QROrder.consumer.order.repository.ConsumerOrderMapper;
import htms.QROrder.consumer.order.repository.ConsumerOrderWriteRows;
import htms.QROrder.consumer.order.service.ConsumerOrderCreationService;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.order.service.ConsumerOrderValidator;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ConsumerOrderCreationServiceTest {

    private final ConsumerVisitService consumerVisitService = mock(ConsumerVisitService.class);
    private final ConsumerOrderValidator consumerOrderValidator = mock(ConsumerOrderValidator.class);
    private final ConsumerOrderMapper consumerOrderMapper = mock(ConsumerOrderMapper.class);
    private final ConsumerOrderCreationService service = new ConsumerOrderCreationService(
            consumerVisitService, consumerOrderValidator, consumerOrderMapper,
            new ConsumerOrderSessionGuard());

    @Test
    void locksVisitAndOrderNumberBeforeWritingCompleteOrder() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerSessionBinding binding = binding();
        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();
        ValidatedConsumerOrder validated = validatedOrder();
        when(consumerVisitService.lockTableForOrdering(qr)).thenReturn(true);
        when(consumerVisitService.lockBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(consumerOrderValidator.validate("PLANT-1", request)).thenReturn(validated);
        when(consumerOrderMapper.lockOrderNumberScope("PLANT-1")).thenReturn(1);
        when(consumerOrderMapper.findNextOrderNumber("PLANT-1")).thenReturn(1002);

        ConsumerOrderCreateResponse response = service.createOrder(qr, binding, request);

        assertEquals("1002", response.getOrderNo());
        assertEquals("RECEIVED", response.getStatus());
        assertEquals(18_000, response.getTotalAmount());
        assertNotNull(response.getOrderedAt());

        ArgumentCaptor<ConsumerOrderWriteRows.Group> group =
                ArgumentCaptor.forClass(ConsumerOrderWriteRows.Group.class);
        ArgumentCaptor<ConsumerOrderWriteRows.Item> item =
                ArgumentCaptor.forClass(ConsumerOrderWriteRows.Item.class);
        ArgumentCaptor<ConsumerOrderWriteRows.Option> option =
                ArgumentCaptor.forClass(ConsumerOrderWriteRows.Option.class);
        verify(consumerOrderMapper).insertOrderGroup(group.capture());
        verify(consumerOrderMapper).insertOrderDetail(item.capture());
        verify(consumerOrderMapper).insertOrderDetailOption(option.capture());

        assertEquals(26, group.getValue().getOrderId().length());
        assertEquals(group.getValue().getOrderId(), item.getValue().getOrderId());
        assertEquals("VISIT-1", item.getValue().getConsumerSessionId());
        assertEquals("MENU-1", item.getValue().getMenuSysId());
        assertEquals(2, item.getValue().getQuantity());
        assertEquals(item.getValue().getOrderItemId(), option.getValue().getOrderItemId());
        assertEquals("OPTION-1", option.getValue().getOptionSysId());
        assertEquals(4, option.getValue().getQuantity());

        InOrder order = inOrder(consumerVisitService, consumerOrderValidator, consumerOrderMapper);
        order.verify(consumerVisitService).lockTableForOrdering(qr);
        order.verify(consumerVisitService).lockBoundVisit(qr, "VISIT-1");
        order.verify(consumerOrderValidator).validate("PLANT-1", request);
        order.verify(consumerOrderMapper).lockOrderNumberScope("PLANT-1");
        order.verify(consumerOrderMapper).findNextOrderNumber("PLANT-1");
        order.verify(consumerOrderMapper).insertOrderGroup(group.getValue());
        order.verify(consumerOrderMapper).insertOrderDetail(item.getValue());
        order.verify(consumerOrderMapper).insertOrderDetailOption(option.getValue());
        order.verify(consumerVisitService).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void rejectsBindingFromDifferentTableBeforeDatabaseWrite() {
        ConsumerSessionBinding otherTable = new ConsumerSessionBinding(
                "VISIT-1", "PLANT-1", "TABLE-OTHER", LocalDateTime.now());

        assertThrows(ConsumerOrderSessionRequiredException.class,
                () -> service.createOrder(qrTableInfo(), otherTable, new ConsumerOrderCreateRequest()));

        verifyNoInteractions(consumerVisitService, consumerOrderValidator, consumerOrderMapper);
    }

    @Test
    void rejectsExpiredVisitBeforeMenuValidation() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerVisitRecord expired = activeVisit();
        expired.setExpired(true);
        when(consumerVisitService.lockTableForOrdering(qr)).thenReturn(true);
        when(consumerVisitService.lockBoundVisit(qr, "VISIT-1")).thenReturn(expired);

        assertThrows(ConsumerOrderSessionGoneException.class,
                () -> service.createOrder(qr, binding(), new ConsumerOrderCreateRequest()));

        verifyNoInteractions(consumerOrderValidator, consumerOrderMapper);
    }

    @Test
    void rejectsPaidVisitBeforeMenuValidation() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerVisitRecord paid = activeVisit();
        paid.setOrderStatus("02");
        when(consumerVisitService.lockTableForOrdering(qr)).thenReturn(true);
        when(consumerVisitService.lockBoundVisit(qr, "VISIT-1")).thenReturn(paid);

        assertThrows(ConsumerOrderSessionGoneException.class,
                () -> service.createOrder(qr, binding(), new ConsumerOrderCreateRequest()));

        verifyNoInteractions(consumerOrderValidator, consumerOrderMapper);
    }

    @Test
    void doesNotWritePartialOrderWhenValidationFails() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();
        when(consumerVisitService.lockTableForOrdering(qr)).thenReturn(true);
        when(consumerVisitService.lockBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(consumerOrderValidator.validate("PLANT-1", request))
                .thenThrow(new ValidationException("옵션 오류"));

        assertThrows(ValidationException.class,
                () -> service.createOrder(qr, binding(), request));

        verifyNoInteractions(consumerOrderMapper);
        verify(consumerVisitService, never()).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void rejectsInactiveTableBeforeVisitLockAndDatabaseWrite() {
        QrConnectResponse qr = qrTableInfo();
        when(consumerVisitService.lockTableForOrdering(qr)).thenReturn(false);

        assertThrows(ConsumerTableInactiveException.class,
                () -> service.createOrder(qr, binding(), new ConsumerOrderCreateRequest()));

        verify(consumerVisitService, never()).lockBoundVisit(qr, "VISIT-1");
        verifyNoInteractions(consumerOrderValidator, consumerOrderMapper);
    }

    private ValidatedConsumerOrder validatedOrder() {
        ValidatedConsumerOrder.Option option = new ValidatedConsumerOrder.Option(
                "OPTION-1", 2, 4, 500, 2_000);
        ValidatedConsumerOrder.Item item = new ValidatedConsumerOrder.Item(
                "MENU-1", 2, 8_000, 9_000, 18_000, List.of(option));
        return new ValidatedConsumerOrder(
                "01K3N8Q9Z6D1F4T2Y7M5C0B8XA", List.of(item), 18_000);
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
        visit.setTableSysId("TABLE-1");
        visit.setSysPlantCd("PLANT-1");
        visit.setOrderStatus("01");
        return visit;
    }
}
