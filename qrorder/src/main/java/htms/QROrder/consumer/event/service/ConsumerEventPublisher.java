package htms.QROrder.consumer.event.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
@Slf4j
public class ConsumerEventPublisher {

    private final ConsumerEventService eventService;

    public void publishAfterCommit(String sysPlantCd, String consumerSessionId, String eventName) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            log.warn("Consumer event skipped outside transaction. eventName={}, consumerSessionId={}",
                    eventName, consumerSessionId);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    eventService.publish(sysPlantCd, consumerSessionId, eventName);
                } catch (RuntimeException exception) {
                    log.warn("Consumer event delivery failed after commit. eventName={}, consumerSessionId={}",
                            eventName, consumerSessionId, exception);
                }
            }
        });
    }
}
