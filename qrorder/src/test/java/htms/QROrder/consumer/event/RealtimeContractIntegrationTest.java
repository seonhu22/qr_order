package htms.QROrder.consumer.event;

import htms.QROrder.client.service.ClientEventPublisher;
import htms.QROrder.common.service.SSEEmitterService;
import htms.QROrder.consumer.event.service.ConsumerEventPublisher;
import htms.QROrder.consumer.event.service.ConsumerEventService;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ValidatedConsumerOrder;
import htms.QROrder.consumer.order.repository.ConsumerOrderMapper;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.order.service.ConsumerOrderTransactionService;
import htms.QROrder.consumer.order.service.ConsumerOrderValidator;
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

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RealtimeContractIntegrationTest {

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void consumerOrderCommitSignalsConsumerAndClientChannels() {
        ConsumerVisitService visitService = mock(ConsumerVisitService.class);
        ConsumerOrderValidator validator = mock(ConsumerOrderValidator.class);
        ConsumerOrderMapper mapper = mock(ConsumerOrderMapper.class);
        ConsumerEventService consumerEvents = mock(ConsumerEventService.class);
        SSEEmitterService emitters = mock(SSEEmitterService.class);
        ConsumerOrderTransactionService service = new ConsumerOrderTransactionService(
                visitService,
                validator,
                mapper,
                new ConsumerOrderSessionGuard(),
                new ConsumerEventPublisher(consumerEvents),
                new ClientEventPublisher(emitters));
        QrConnectResponse qr = qr();
        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();

        when(visitService.lockTableForOrdering(qr)).thenReturn(true);
        when(visitService.lockBoundVisit(qr, "VISIT-1")).thenReturn(activeVisit());
        when(validator.validate("PLANT-1", request)).thenReturn(validatedOrder());
        when(mapper.lockOrderNumberScope("PLANT-1")).thenReturn(1);
        when(mapper.findNextOrderNumber("PLANT-1")).thenReturn(1);
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        service.createOrder(qr, binding(), request);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(TransactionSynchronization::afterCommit);

        verify(consumerEvents).publish("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);
        verify(emitters).send(
                "client:PLANT-1", ClientEventPublisher.ORDER_STATUS_CHANGED, "");
    }

    private QrConnectResponse qr() {
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

    private ValidatedConsumerOrder validatedOrder() {
        ValidatedConsumerOrder.Item item = new ValidatedConsumerOrder.Item(
                "MENU-1", 1, 8_000, 8_000, 8_000, List.of());
        return new ValidatedConsumerOrder(
                "01K3N8Q9Z6D1F4T2Y7M5C0B8XA", List.of(item), 8_000);
    }
}
