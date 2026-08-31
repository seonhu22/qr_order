package htms.QROrder.consumer.order.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateResponse;
import htms.QROrder.consumer.order.dto.ValidatedConsumerOrder;
import htms.QROrder.consumer.order.exception.ConsumerTableInactiveException;
import htms.QROrder.consumer.order.repository.ConsumerOrderMapper;
import htms.QROrder.consumer.order.repository.ConsumerOrderWriteRows;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsumerOrderCreationService {

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

        if (!consumerVisitService.lockTableForOrdering(qrTableInfo)) {
            throw new ConsumerTableInactiveException("현재 테이블에서는 새 주문을 할 수 없습니다.");
        }

        ConsumerVisitRecord visit = consumerVisitService.lockBoundVisit(
                qrTableInfo, binding.getConsumerSessionId());
        consumerOrderSessionGuard.requireActiveVisit(visit);

        ValidatedConsumerOrder validatedOrder = consumerOrderValidator.validate(
                qrTableInfo.getSysPlantCd(), request);

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

    private String newUlid() {
        return UlidCreator.getMonotonicUlid().toString();
    }
}
