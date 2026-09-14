package htms.QROrder.consumer.event;

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
}
