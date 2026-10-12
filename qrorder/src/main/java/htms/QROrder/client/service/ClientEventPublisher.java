package htms.QROrder.client.service;

import htms.QROrder.common.service.SSEEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClientEventPublisher {
    public static final String ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED";

    private final SSEEmitterService emitterService;

    public void publishAfterCommit(String sysPlantCd, String eventName) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            log.warn("Client event skipped outside transaction. eventName={}, sysPlantCd={}",
                    eventName, sysPlantCd);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    emitterService.send("client:" + sysPlantCd, eventName, "");
                } catch (RuntimeException exception) {
                    log.warn("Client event delivery failed after commit. eventName={}, sysPlantCd={}",
                            eventName, sysPlantCd, exception);
                }
            }
        });
    }
}
