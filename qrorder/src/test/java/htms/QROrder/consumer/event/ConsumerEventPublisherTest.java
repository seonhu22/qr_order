package htms.QROrder.consumer.event;

import htms.QROrder.client.service.ClientEventPublisher;
import htms.QROrder.common.service.SSEEmitterService;
import htms.QROrder.consumer.event.service.ConsumerEventPublisher;
import htms.QROrder.consumer.event.service.ConsumerEventService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verifyNoInteractions;

class ConsumerEventPublisherTest {

    private final ConsumerEventService eventService = mock(ConsumerEventService.class);
    private final ConsumerEventPublisher publisher = new ConsumerEventPublisher(eventService);

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void publishesOnlyAfterCommit() {
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        publisher.publishAfterCommit("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);

        verify(eventService, never()).publish("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);
        for (TransactionSynchronization synchronization
                : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }
        verify(eventService).publish("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);
    }

    @Test
    void doesNotPublishWithoutAnActiveTransaction() {
        publisher.publishAfterCommit("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);

        verify(eventService, never()).publish("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);
    }

    @Test
    void isolatesDeliveryFailureFromAnAlreadyCommittedTransaction() {
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        doThrow(new IllegalStateException("emitter failure"))
                .when(eventService)
                .publish("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);
        publisher.publishAfterCommit("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);

        for (TransactionSynchronization synchronization
                : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }

        verify(eventService).publish("PLANT-1", "VISIT-1", ConsumerEventService.ORDER_CREATED);
    }

    @Test
    void clientEventPublishesOnceOnlyAfterCommitAndIgnoresDeliveryFailure() {
        SSEEmitterService emitter = mock(SSEEmitterService.class);
        ClientEventPublisher clientPublisher = new ClientEventPublisher(emitter);
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        doThrow(new RuntimeException("stream unavailable")).when(emitter)
                .send("client:PLANT-1", ClientEventPublisher.ORDER_STATUS_CHANGED, "");

        clientPublisher.publishAfterCommit("PLANT-1", ClientEventPublisher.ORDER_STATUS_CHANGED);

        verifyNoInteractions(emitter);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(TransactionSynchronization::afterCommit);
        verify(emitter, times(1))
                .send("client:PLANT-1", ClientEventPublisher.ORDER_STATUS_CHANGED, "");
    }

    @Test
    void clientEventDoesNotPublishOnRollback() {
        SSEEmitterService emitter = mock(SSEEmitterService.class);
        ClientEventPublisher clientPublisher = new ClientEventPublisher(emitter);
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        clientPublisher.publishAfterCommit("PLANT-1", ClientEventPublisher.ORDER_STATUS_CHANGED);
        TransactionSynchronizationManager.getSynchronizations().forEach(synchronization ->
                synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        verifyNoInteractions(emitter);
    }
}
