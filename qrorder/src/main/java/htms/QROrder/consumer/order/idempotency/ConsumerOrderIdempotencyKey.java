package htms.QROrder.consumer.order.idempotency;

import java.util.Objects;

public record ConsumerOrderIdempotencyKey(
        String sysPlantCd,
        String consumerSessionId,
        String clientRequestId) {

    public ConsumerOrderIdempotencyKey {
        Objects.requireNonNull(sysPlantCd, "sysPlantCd must not be null");
        Objects.requireNonNull(consumerSessionId, "consumerSessionId must not be null");
        Objects.requireNonNull(clientRequestId, "clientRequestId must not be null");
    }
}
