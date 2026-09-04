package htms.QROrder.consumer.order.service;

import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.order.dto.ConsumerOrderDetailItem;
import htms.QROrder.consumer.order.dto.ConsumerOrderDetailOption;
import htms.QROrder.consumer.order.dto.ConsumerOrderDetailResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderListResponse;
import htms.QROrder.consumer.order.dto.ConsumerOrderSummary;
import htms.QROrder.consumer.order.exception.ConsumerOrderNotFoundException;
import htms.QROrder.consumer.order.repository.ConsumerOrderMapper;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderDetailHeaderRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderItemRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderOptionRow;
import htms.QROrder.consumer.order.repository.row.ConsumerOrderSummaryRow;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConsumerOrderQueryService {

    private final ConsumerVisitService consumerVisitService;
    private final ConsumerOrderSessionGuard consumerOrderSessionGuard;
    private final ConsumerOrderMapper consumerOrderMapper;

    @Transactional
    public ConsumerOrderListResponse getOrders(QrConnectResponse qrTableInfo,
                                               ConsumerSessionBinding binding) {
        requireActiveSession(qrTableInfo, binding);
        List<ConsumerOrderSummary> orders = consumerOrderMapper.findOrders(
                        binding.getConsumerSessionId(), qrTableInfo.getSysPlantCd())
                .stream()
                .map(this::summary)
                .toList();
        requireOpenVisit(binding.getConsumerSessionId(), qrTableInfo.getSysPlantCd());
        consumerVisitService.touchBoundVisit(qrTableInfo, binding.getConsumerSessionId());
        return new ConsumerOrderListResponse(orders);
    }

    @Transactional
    public ConsumerOrderDetailResponse getOrder(QrConnectResponse qrTableInfo,
                                                ConsumerSessionBinding binding,
                                                String orderId) {
        requireActiveSession(qrTableInfo, binding);
        String normalizedOrderId = normalizeOrderId(orderId);
        ConsumerOrderDetailHeaderRow header = consumerOrderMapper.findOrderDetailHeader(
                binding.getConsumerSessionId(), qrTableInfo.getSysPlantCd(), normalizedOrderId);
        if (header == null) {
            throw new ConsumerOrderNotFoundException("주문을 찾을 수 없습니다.");
        }

        List<ConsumerOrderItemRow> itemRows = consumerOrderMapper.findOrderItems(
                binding.getConsumerSessionId(), qrTableInfo.getSysPlantCd(), normalizedOrderId);
        if (itemRows.isEmpty()) {
            throw new IllegalStateException("주문 상세 항목이 없습니다.");
        }
        List<ConsumerOrderOptionRow> optionRows = consumerOrderMapper.findOrderOptions(
                binding.getConsumerSessionId(), qrTableInfo.getSysPlantCd(), normalizedOrderId);

        ConsumerOrderDetailResponse response = detail(header, itemRows, optionRows);
        requireOpenVisit(binding.getConsumerSessionId(), qrTableInfo.getSysPlantCd());
        consumerVisitService.touchBoundVisit(qrTableInfo, binding.getConsumerSessionId());
        return response;
    }

    private void requireActiveSession(QrConnectResponse qrTableInfo,
                                      ConsumerSessionBinding binding) {
        consumerOrderSessionGuard.requireMatchingBinding(qrTableInfo, binding);
        ConsumerVisitRecord visit = consumerVisitService.lockBoundVisit(
                qrTableInfo, binding.getConsumerSessionId());
        consumerOrderSessionGuard.requireActiveVisit(visit);
        requireOpenVisit(binding.getConsumerSessionId(), qrTableInfo.getSysPlantCd());
    }

    private void requireOpenVisit(String consumerSessionId, String sysPlantCd) {
        if (consumerOrderMapper.existsClosedVisit(consumerSessionId, sysPlantCd)) {
            throw new htms.QROrder.consumer.order.exception.ConsumerOrderSessionGoneException(
                    "종료되었거나 만료된 방문입니다.");
        }
    }

    private ConsumerOrderSummary summary(ConsumerOrderSummaryRow row) {
        return new ConsumerOrderSummary(
                row.getOrderId(),
                Integer.toString(row.getOrderNumber()),
                status(row.getOrderStatus()),
                amount(row.getTotalAmount()),
                amount(row.getItemCount()),
                row.getOrderedAt(),
                row.getUpdatedAt()
        );
    }

    private ConsumerOrderDetailResponse detail(
            ConsumerOrderDetailHeaderRow header,
            List<ConsumerOrderItemRow> itemRows,
            List<ConsumerOrderOptionRow> optionRows) {
        Map<String, List<ConsumerOrderOptionRow>> optionsByItem = new HashMap<>();
        for (ConsumerOrderOptionRow option : optionRows) {
            optionsByItem.computeIfAbsent(option.getOrderItemId(), ignored -> new ArrayList<>())
                    .add(option);
        }

        List<ConsumerOrderDetailItem> items = new ArrayList<>();
        int totalAmount = 0;
        for (ConsumerOrderItemRow itemRow : itemRows) {
            ConsumerOrderDetailItem item = detailItem(
                    itemRow, optionsByItem.getOrDefault(itemRow.getOrderItemId(), List.of()));
            items.add(item);
            totalAmount = add(totalAmount, item.getLineAmount());
        }

        return new ConsumerOrderDetailResponse(
                header.getOrderId(),
                Integer.toString(header.getOrderNumber()),
                status(header.getOrderStatus()),
                null,
                totalAmount,
                header.getOrderedAt(),
                header.getUpdatedAt(),
                List.copyOf(items)
        );
    }

    private ConsumerOrderDetailItem detailItem(
            ConsumerOrderItemRow item,
            List<ConsumerOrderOptionRow> optionRows) {
        if (item.getQuantity() == null || item.getQuantity() < 1
                || item.getMenuUnitAmount() == null || item.getMenuUnitAmount() < 0) {
            throw new IllegalStateException("주문 메뉴 수량 또는 가격 정보가 올바르지 않습니다.");
        }

        List<ConsumerOrderDetailOption> options = new ArrayList<>();
        int optionUnitAmount = 0;
        for (ConsumerOrderOptionRow option : optionRows) {
            if (option.getStoredQuantity() == null
                    || option.getStoredQuantity() < 1
                    || option.getStoredQuantity() % item.getQuantity() != 0
                    || option.getUnitAmount() == null
                    || option.getUnitAmount() < 0) {
                throw new IllegalStateException("주문 옵션 수량 또는 가격 정보가 올바르지 않습니다.");
            }
            int quantity = option.getStoredQuantity() / item.getQuantity();
            int lineAmount = multiply(option.getUnitAmount(), option.getStoredQuantity());
            optionUnitAmount = add(optionUnitAmount, multiply(option.getUnitAmount(), quantity));
            options.add(new ConsumerOrderDetailOption(
                    option.getOptionSysId(), option.getOptionName(), quantity,
                    option.getUnitAmount(), lineAmount));
        }

        int unitAmount = add(item.getMenuUnitAmount(), optionUnitAmount);
        return new ConsumerOrderDetailItem(
                item.getOrderItemId(), item.getMenuSysId(), item.getMenuName(), item.getQuantity(),
                unitAmount, multiply(unitAmount, item.getQuantity()), List.copyOf(options));
    }

    private String normalizeOrderId(String orderId) {
        if (orderId == null || orderId.isBlank() || orderId.length() > 64) {
            throw new ValidationException("orderId를 확인해주세요.");
        }
        return orderId.strip();
    }

    private String status(String status) {
        return switch (status) {
            case "01" -> "RECEIVED";
            case "02" -> "COOKING";
            case "03" -> "SERVED";
            case "04" -> "PAID";
            case "05" -> "UNPAID";
            case "99!" -> "CANCELLED";
            default -> throw new IllegalStateException("지원하지 않는 주문 상태입니다.");
        };
    }

    private int amount(Long value) {
        if (value == null || value < 0 || value > Integer.MAX_VALUE) {
            throw new IllegalStateException("주문 합계가 허용 범위를 벗어났습니다.");
        }
        return value.intValue();
    }

    private int add(int left, int right) {
        try {
            return Math.addExact(left, right);
        } catch (ArithmeticException exception) {
            throw new IllegalStateException("주문 합계가 허용 범위를 벗어났습니다.");
        }
    }

    private int multiply(int left, int right) {
        try {
            return Math.multiplyExact(left, right);
        } catch (ArithmeticException exception) {
            throw new IllegalStateException("주문 합계가 허용 범위를 벗어났습니다.");
        }
    }
}
