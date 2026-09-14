package htms.QROrder.consumer.order;

import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.dto.ValidatedConsumerOrder;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.exception.ConsumerTableInactiveException;
import htms.QROrder.consumer.order.repository.ConsumerOrderMapper;
import htms.QROrder.consumer.order.repository.ConsumerOrderWriteRows;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.order.service.ConsumerOrderTransactionService;
import htms.QROrder.consumer.order.service.ConsumerOrderValidator;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ConsumerOrderTransactionServiceTest {

    private final ConsumerVisitService visitService = mock(ConsumerVisitService.class);
    private final ConsumerOrderValidator validator = mock(ConsumerOrderValidator.class);
    private final ConsumerOrderMapper mapper = mock(ConsumerOrderMapper.class);
    private final ConsumerOrderTransactionService service = new ConsumerOrderTransactionService(
            visitService, validator, mapper, new ConsumerOrderSessionGuard());

    @Test
    void locksAndWritesTheCompleteValidatedOrder() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();
        when(visitService.lockTableForOrdering(qr)).thenReturn(true);
        when(visitService.lockBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(validator.validate("PLANT-1", request)).thenReturn(validatedOrder());
        when(mapper.lockOrderNumberScope("PLANT-1")).thenReturn(1);
        when(mapper.findNextOrderNumber("PLANT-1")).thenReturn(1002);

        ConsumerOrderCreateResponse response = service.createOrder(qr, binding(), request);

        assertEquals("1002", response.getOrderNo());
        assertEquals(18_000, response.getTotalAmount());
        ArgumentCaptor<ConsumerOrderWriteRows.Item> item =
                ArgumentCaptor.forClass(ConsumerOrderWriteRows.Item.class);
        ArgumentCaptor<ConsumerOrderWriteRows.Option> option =
                ArgumentCaptor.forClass(ConsumerOrderWriteRows.Option.class);
        verify(mapper).insertOrderGroup(org.mockito.ArgumentMatchers.any());
        verify(mapper).insertOrderDetail(item.capture());
        verify(mapper).insertOrderDetailOption(option.capture());
        assertEquals("MENU-1", item.getValue().getMenuSysId());
        assertEquals(4, option.getValue().getQuantity());
        verify(visitService).touchBoundVisit(qr, "VISIT-1");
    }

    @Test
    void rejectsInactiveTableBeforeVisitAndWrites() {
        QrConnectResponse qr = qrTableInfo();
        when(visitService.lockTableForOrdering(qr)).thenReturn(false);

        assertThrows(ConsumerTableInactiveException.class,
                () -> service.createOrder(qr, binding(), new ConsumerOrderCreateRequest()));

        verify(visitService, never()).lockBoundVisit(qr, "VISIT-1");
        verifyNoInteractions(validator, mapper);
    }

    @Test
    void rejectsClosedVisitBeforeValidationAndWrites() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerVisitRecord visit = activeVisit();
        visit.setOrderStatus("02");
        when(visitService.lockTableForOrdering(qr)).thenReturn(true);
        when(visitService.lockBoundVisit(qr, "VISIT-1")).thenReturn(visit);

        assertThrows(ConsumerOrderSessionGoneException.class,
                () -> service.createOrder(qr, binding(), new ConsumerOrderCreateRequest()));

        verifyNoInteractions(validator, mapper);
    }

    @Test
    void stopsBeforeWritesWhenMenuValidationFails() {
        QrConnectResponse qr = qrTableInfo();
        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();
        when(visitService.lockTableForOrdering(qr)).thenReturn(true);
        when(visitService.lockBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(validator.validate("PLANT-1", request)).thenThrow(new ValidationException("옵션 오류"));

        assertThrows(ValidationException.class, () -> service.createOrder(qr, binding(), request));

        verifyNoInteractions(mapper);
        verify(visitService, never()).touchBoundVisit(qr, "VISIT-1");
    }

    private ValidatedConsumerOrder validatedOrder() {
        ValidatedConsumerOrder.Option option = new ValidatedConsumerOrder.Option(
                "OPTION-1", 2, 4, 500, 2_000);
        ValidatedConsumerOrder.Item item = new ValidatedConsumerOrder.Item(
                "MENU-1", 2, 8_000, 9_000, 18_000, List.of(option));
        return new ValidatedConsumerOrder("01K3N8Q9Z6D1F4T2Y7M5C0B8XA", List.of(item), 18_000);
    }

    private QrConnectResponse qrTableInfo() {
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysId("TABLE-1");
        qr.setSysPlantCd("PLANT-1");
        return qr;
    }

    private ConsumerSessionBinding binding() {
        return new ConsumerSessionBinding("VISIT-1", "PLANT-1", "TABLE-1", LocalDateTime.now());
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
