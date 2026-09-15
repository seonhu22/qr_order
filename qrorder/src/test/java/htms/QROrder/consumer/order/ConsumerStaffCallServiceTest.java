package htms.QROrder.consumer.order;

import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.common.service.SSEEmitterService;
import htms.QROrder.consumer.order.dto.ConsumerStaffCallRequest;
import htms.QROrder.consumer.order.dto.ConsumerStaffCallResponse;
import htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException;
import htms.QROrder.consumer.order.repository.ConsumerStaffCallMapper;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.order.service.ConsumerStaffCallService;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ConsumerStaffCallServiceTest {

    private final ConsumerStaffCallMapper mapper = mock(ConsumerStaffCallMapper.class);
    private final ConsumerVisitService visitService = mock(ConsumerVisitService.class);
    private final SSEEmitterService emitterService = mock(SSEEmitterService.class);
    private final ConsumerStaffCallService service = new ConsumerStaffCallService(
            mapper, visitService, new ConsumerOrderSessionGuard(), emitterService);

    @AfterEach
    void clearTransactionSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void savesBatchAndPublishesOneEventOnlyAfterCommit() {
        arrangeActiveVisitAndSettings();
        beginTransactionSynchronization();

        service.saveConsumerStaffCall(request(item("WATER", 2), item("PLATE", 1)), qr(), binding());

        verify(mapper, times(2)).saveConsumerStaffCall(anyString(), anyString(), anyString(), eq("PLANT-1"));
        verifyNoInteractions(emitterService);

        for (TransactionSynchronization synchronization
                : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }
        verify(emitterService).send(eq("client:PLANT-1"), eq("STAFF_CALLED"), any());
    }

    @Test
    void rejectsUnknownCallCodeBeforeSavingAnything() {
        arrangeActiveVisitAndSettings();

        assertThrows(ValidationException.class,
                () -> service.saveConsumerStaffCall(request(item("WATER", 1), item("OTHER", 1)), qr(), binding()));

        verify(mapper, never()).saveConsumerStaffCall(anyString(), anyString(), anyString(), anyString());
        verifyNoInteractions(emitterService);
    }

    @Test
    void rejectsDuplicateCallCodeBeforeSavingAnything() {
        arrangeActiveVisitAndSettings();

        assertThrows(ValidationException.class,
                () -> service.saveConsumerStaffCall(request(item("WATER", 1), item("WATER", 2)), qr(), binding()));

        verify(mapper, never()).saveConsumerStaffCall(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void rejectsQuantityOutsideOneToNinetyNine() {
        arrangeActiveVisitAndSettings();

        assertThrows(ValidationException.class,
                () -> service.saveConsumerStaffCall(request(item("WATER", 100)), qr(), binding()));
        verify(mapper, never()).saveConsumerStaffCall(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void rejectsClosedVisitBeforeReadingSettings() {
        ConsumerVisitRecord closed = activeVisit();
        closed.setOrderStatus("02");
        when(visitService.lockBoundVisit(any(), eq("VISIT-1"))).thenReturn(closed);

        assertThrows(ConsumerOrderSessionGoneException.class,
                () -> service.saveConsumerStaffCall(request(item("WATER", 1)), qr(), binding()));

        verifyNoInteractions(mapper, emitterService);
    }

    private void arrangeActiveVisitAndSettings() {
        when(visitService.lockBoundVisit(any(), eq("VISIT-1"))).thenReturn(activeVisit());
        when(mapper.getConsumerStaffCall("PLANT-1")).thenReturn(List.of(
                setting("WATER", "물"), setting("PLATE", "앞접시")));
    }

    private void beginTransactionSynchronization() {
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
    }

    private ConsumerStaffCallRequest request(ConsumerStaffCallRequest.Item... items) {
        ConsumerStaffCallRequest request = new ConsumerStaffCallRequest();
        request.setItems(List.of(items));
        return request;
    }

    private ConsumerStaffCallRequest.Item item(String callCd, int quantity) {
        ConsumerStaffCallRequest.Item item = new ConsumerStaffCallRequest.Item();
        item.setCallCd(callCd);
        item.setQuantity(quantity);
        return item;
    }

    private ConsumerStaffCallResponse setting(String callCd, String callName) {
        ConsumerStaffCallResponse setting = new ConsumerStaffCallResponse();
        setting.setCallCd(callCd);
        setting.setCallNm(callName);
        return setting;
    }

    private QrConnectResponse qr() {
        QrConnectResponse qr = new QrConnectResponse();
        qr.setSysId("TABLE-1");
        qr.setTableName("3번");
        qr.setSysPlantCd("PLANT-1");
        return qr;
    }

    private ConsumerSessionBinding binding() {
        return new ConsumerSessionBinding("VISIT-1", "PLANT-1", "TABLE-1", LocalDateTime.now());
    }

    private ConsumerVisitRecord activeVisit() {
        ConsumerVisitRecord visit = new ConsumerVisitRecord();
        visit.setConsumerSessionId("VISIT-1");
        visit.setOrderStatus("01");
        visit.setTableActive(true);
        return visit;
    }
}
