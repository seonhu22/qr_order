package htms.QROrder.consumer.order.service;

import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.idempotency.ConsumerOrderIdempotencyKey;
import htms.QROrder.consumer.order.idempotency.ConsumerOrderIdempotencyStore;
import htms.QROrder.consumer.order.idempotency.ConsumerOrderRequestFingerprint;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.qr.dto.QrConnectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConsumerOrderCreationService {

    private final ConsumerOrderValidator consumerOrderValidator;
    private final ConsumerOrderSessionGuard consumerOrderSessionGuard;
    private final ConsumerOrderIdempotencyStore idempotencyStore;
    private final ConsumerOrderTransactionService transactionService;

    public ConsumerOrderCreateResponse createOrder(
            QrConnectResponse qrTableInfo,
            ConsumerSessionBinding binding,
            ConsumerOrderCreateRequest request) {
        consumerOrderSessionGuard.requireMatchingBinding(qrTableInfo, binding);
        consumerOrderValidator.validateRequest(request);

        ConsumerOrderIdempotencyKey key = new ConsumerOrderIdempotencyKey(
                qrTableInfo.getSysPlantCd(),
                binding.getConsumerSessionId(),
                request.getClientRequestId().strip());
        String fingerprint = ConsumerOrderRequestFingerprint.create(request);

        return idempotencyStore.execute(
                key,
                fingerprint,
                () -> transactionService.createOrder(qrTableInfo, binding, request));
    }
}
