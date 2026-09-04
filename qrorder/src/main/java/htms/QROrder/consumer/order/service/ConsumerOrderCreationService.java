package htms.QROrder.consumer.order.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.dto.ValidatedConsumerOrder;
import htms.QROrder.consumer.order.exception.ConsumerOrderExpiredRequestException;
import htms.QROrder.consumer.order.repository.ConsumerOrderMapper;
import htms.QROrder.consumer.order.repository.ConsumerOrderWriteRows;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderIdempotencyRow;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsumerOrderCreationService {

    private static final Duration IDEMPOTENCY_TTL = Duration.ofMinutes(10);

    private final ConsumerVisitService consumerVisitService;
    private final ConsumerOrderValidator consumerOrderValidator;
    private final ConsumerOrderMapper consumerOrderMapper;
    private final ConsumerOrderSessionGuard consumerOrderSessionGuard;

    @Transactional
    public ConsumerOrderCreateResponse createOrder(
            QrConnectResponse qrTableInfo,
            ConsumerSessionBinding binding,
            ConsumerOrderCreateRequest request) {
        consumerOrderSessionGuard.requireMatchingBinding(qrTableInfo, binding);

        ConsumerVisitRecord visit = consumerVisitService.lockBoundVisit(
                qrTableInfo, binding.getConsumerSessionId());
        consumerOrderSessionGuard.requireActiveVisit(visit);

        ValidatedConsumerOrder validatedOrder = consumerOrderValidator.validate(
                qrTableInfo.getSysPlantCd(), request);

        ConsumerOrderIdempotencyRow existing = consumerOrderMapper.findIdempotencyRecord(
                validatedOrder.clientRequestId());
        if (existing != null) {
            return replayOrThrow(existing);
        }

        consumerOrderMapper.lockOrderNumberScope(qrTableInfo.getSysPlantCd());
        int orderNumber = consumerOrderMapper.findNextOrderNumber(qrTableInfo.getSysPlantCd());
        String orderId = newUlid();
        LocalDateTime orderedAt = LocalDateTime.now();

        consumerOrderMapper.insertOrderGroup(new ConsumerOrderWriteRows.Group(
                orderId,
                binding.getConsumerSessionId(),
                qrTableInfo.getSysPlantCd(),
                orderNumber,
                orderedAt
        ));

        for (ValidatedConsumerOrder.Item item : validatedOrder.items()) {
            String orderItemId = newUlid();
            consumerOrderMapper.insertOrderDetail(new ConsumerOrderWriteRows.Item(
                    orderItemId,
                    binding.getConsumerSessionId(),
                    orderId,
                    item.menuSysId(),
                    qrTableInfo.getSysPlantCd(),
                    item.quantity(),
                    !item.options().isEmpty(),
                    orderedAt
            ));

            for (ValidatedConsumerOrder.Option option : item.options()) {
                consumerOrderMapper.insertOrderDetailOption(new ConsumerOrderWriteRows.Option(
                        newUlid(),
                        orderItemId,
                        option.optionSysId(),
                        qrTableInfo.getSysPlantCd(),
                        option.storedQuantity(),
                        orderedAt
                ));
            }
        }

        consumerOrderMapper.insertIdempotencyRecord(new ConsumerOrderWriteRows.Idempotency(
                validatedOrder.clientRequestId(),
                qrTableInfo.getSysPlantCd(),
                orderId,
                orderNumber,
                "RECEIVED",
                validatedOrder.totalAmount(),
                orderedAt
        ));

        consumerVisitService.touchBoundVisit(qrTableInfo, binding.getConsumerSessionId());
        log.info("Consumer order created. clientRequestId={}, orderId={}, consumerSessionId={}",
                validatedOrder.clientRequestId(), orderId, binding.getConsumerSessionId());

        return new ConsumerOrderCreateResponse(
                orderId,
                Integer.toString(orderNumber),
                "RECEIVED",
                validatedOrder.totalAmount(),
                orderedAt
        );
    }

    /**
     * TTL 이내 재시도는 기존 주문 생성 결과를 그대로 재생하고, TTL이 지난 뒤의 재요청은
     * 새 주문을 만들지 않고 만료로 거부해 클라이언트가 새 clientRequestId로 다시 시도하게 한다.
     */
    private ConsumerOrderCreateResponse replayOrThrow(ConsumerOrderIdempotencyRow existing) {
        if (existing.getOrderedAt().isBefore(LocalDateTime.now().minus(IDEMPOTENCY_TTL))) {
            throw new ConsumerOrderExpiredRequestException(
                    "이미 처리되었거나 만료된 요청입니다. 다시 시도해주세요.");
        }

        return new ConsumerOrderCreateResponse(
                existing.getOrderId(),
                Integer.toString(existing.getOrderNum()),
                existing.getOrderStatus(),
                existing.getTotalAmount(),
                existing.getOrderedAt()
        );
    }

    private String newUlid() {
        return UlidCreator.getMonotonicUlid().toString();
    }
}
