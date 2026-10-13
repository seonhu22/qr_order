package htms.QROrder.client.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.client.dto.OrderRevisionRequest;
import htms.QROrder.client.dto.OrderRevisionResponse;
import htms.QROrder.client.exception.OrderRevisionException;
import htms.QROrder.client.repository.OrderRevisionMapper;
import htms.QROrder.client.repository.OrderRevisionRows;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.order.dto.ConsumerOrderCreateRequest;
import htms.QROrder.consumer.order.dto.ValidatedConsumerOrder;
import htms.QROrder.consumer.order.exception.ConsumerOrderConflictException;
import htms.QROrder.consumer.order.exception.ConsumerOrderNotFoundException;
import htms.QROrder.consumer.order.service.ConsumerOrderValidator;
import htms.QROrder.consumer.event.service.ConsumerEventPublisher;
import htms.QROrder.consumer.event.service.ConsumerEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class OrderRevisionTransactionService {
    private static final Pattern REQUEST_ID = Pattern.compile(
            "(?:[0-9A-HJKMNP-TV-Z]{26}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})",
            Pattern.CASE_INSENSITIVE);

    private final OrderRevisionMapper mapper;
    private final ConsumerOrderValidator orderValidator;
    private final ObjectMapper objectMapper;
    private final ConsumerEventPublisher consumerEventPublisher;
    private final ClientEventPublisher clientEventPublisher;

    @Transactional
    public OrderRevisionResponse revise(String sysPlantCd, String userId,
                                        OrderRevisionRequest request, String fingerprint) {
        NormalizedRequest normalized = validateRequest(request);

        OrderRevisionRows.Revision prior = mapper.findRevision(sysPlantCd, normalized.clientRequestId());
        if (prior != null) return replay(prior, fingerprint);

        List<OrderRevisionRows.Target> candidates = mapper.findTargets(sysPlantCd, normalized.orderGroupIds());
        Scope scope = requireSingleScope(candidates, normalized.orderGroupIds());
        boolean hasAdds = !normalized.addedItems().isEmpty();
        String tableUseYn = null;
        if (hasAdds) {
            tableUseYn = mapper.lockTable(sysPlantCd, scope.tableSysId());
            if (tableUseYn == null) throw OrderRevisionException.notFound();
        }

        String masterStatus = mapper.lockOrderMaster(sysPlantCd, scope.orderMasterId(), scope.tableSysId());
        if (masterStatus == null) throw OrderRevisionException.notFound();
        List<OrderRevisionRows.Target> lockedGroups = mapper.lockOrderGroups(sysPlantCd, normalized.orderGroupIds());
        List<String> lockedDetails = List.of();
        if (!normalized.removeDetailIds().isEmpty()) {
            lockedDetails = mapper.lockOrderDetails(sysPlantCd, scope.orderMasterId(),
                    normalized.orderGroupIds(), normalized.removeDetailIds());
        }

        // 같은 key의 선행 트랜잭션을 업무 잠금에서 기다렸다면 변경된 상태를 검사하기 전에 replay한다.
        OrderRevisionRows.Revision completedWhileWaiting =
                mapper.findRevision(sysPlantCd, normalized.clientRequestId());
        if (completedWhileWaiting != null) return replay(completedWhileWaiting, fingerprint);

        Scope lockedScope = requireSingleScope(lockedGroups, normalized.orderGroupIds());
        if (!scope.equals(lockedScope)) throw OrderRevisionException.notFound();
        if (hasAdds && !"Y".equals(tableUseYn)) {
            throw OrderRevisionException.conflict("TABLE_INACTIVE",
                    "비활성화된 테이블에는 메뉴를 추가할 수 없습니다.");
        }
        if (!"01".equals(masterStatus)) {
            throw OrderRevisionException.conflict("ORDER_REVISION_VISIT_CLOSED",
                    "종료된 방문의 주문은 수정할 수 없습니다.");
        }
        if (lockedGroups.stream().anyMatch(group -> !Set.of("01", "02").contains(group.getOrderStatus()))) {
            throw OrderRevisionException.conflict("ORDER_REVISION_STATUS_CONFLICT",
                    "접수 또는 조리 중인 주문만 수정할 수 있습니다.");
        }
        if (lockedDetails.size() != normalized.removeDetailIds().size()) {
            throw OrderRevisionException.conflict("ORDER_REVISION_DETAIL_CONFLICT",
                    "제거할 메뉴가 없거나 이미 제거되었습니다.");
        }

        ValidatedConsumerOrder validatedAdditions = hasAdds
                ? validateAdditions(sysPlantCd, normalized)
                : null;
        String revisionId = newUlid();
        int reserved = mapper.reserveRevision(revisionId, sysPlantCd, normalized.clientRequestId(),
                scope.orderMasterId(), scope.tableSysId(), fingerprint, userId);
        if (reserved == 0) {
            OrderRevisionRows.Revision concurrent = mapper.findRevision(sysPlantCd, normalized.clientRequestId());
            if (concurrent == null) throw new IllegalStateException("멱등성 요청 선점 결과를 조회할 수 없습니다.");
            return replay(concurrent, fingerprint);
        }
        LocalDateTime now = LocalDateTime.now();

        if (!normalized.removeDetailIds().isEmpty()) {
            int inserted = mapper.insertRemovedDetails(revisionId, normalized.removeDetailIds(), now);
            if (inserted != normalized.removeDetailIds().size()) {
                throw new IllegalStateException("주문 제거 이력 일부를 저장하지 못했습니다.");
            }
        }
        List<String> cancelledGroups = normalized.removeDetailIds().isEmpty() ? List.of()
                : mapper.findEmptyOrderGroups(sysPlantCd, normalized.orderGroupIds());
        if (!cancelledGroups.isEmpty()) {
            int updated = mapper.cancelEmptyOrderGroups(sysPlantCd, cancelledGroups, userId, now);
            if (updated != cancelledGroups.size()) {
                throw OrderRevisionException.conflict("ORDER_REVISION_STATUS_CONFLICT",
                        "주문 상태가 변경되어 자동 취소할 수 없습니다.");
            }
        }

        CreatedOrder created = hasAdds
                ? createAddedOrder(sysPlantCd, userId, scope.orderMasterId(), validatedAdditions, now)
                : CreatedOrder.none();
        OrderRevisionResponse response = new OrderRevisionResponse(
                revisionId, normalized.removeDetailIds(), List.copyOf(cancelledGroups),
                created.orderId(), created.orderNumber(), created.totalAmount());
        if (mapper.completeRevision(revisionId, writeResponse(response), now) != 1) {
            throw new IllegalStateException("주문 수정 멱등성 응답을 완료하지 못했습니다.");
        }
        consumerEventPublisher.publishAfterCommit(
                sysPlantCd, scope.orderMasterId(), ConsumerEventService.STATUS_CHANGED);
        clientEventPublisher.publishAfterCommit(sysPlantCd, ClientEventPublisher.ORDER_STATUS_CHANGED);
        return response;
    }

    private NormalizedRequest validateRequest(OrderRevisionRequest request) {
        if (request == null) throw OrderRevisionException.badRequest("주문 수정 요청이 필요합니다.");
        String requestId = normalize(request.getClientRequestId());
        if (requestId == null || !REQUEST_ID.matcher(requestId).matches()) {
            throw OrderRevisionException.badRequest("clientRequestId는 ULID 또는 UUID 형식이어야 합니다.");
        }
        List<String> groupIds = normalizeIds(request.getOrderGroupIds(), "orderGroupIds", false);
        List<String> detailIds = normalizeIds(request.getRemoveDetailIds(), "removeDetailIds", true);
        List<htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest> items =
                request.getAddedItems() == null ? List.of() : new ArrayList<>(request.getAddedItems());
        if (detailIds.isEmpty() && items.isEmpty()) {
            throw OrderRevisionException.badRequest("제거하거나 추가할 메뉴가 1개 이상이어야 합니다.");
        }
        return new NormalizedRequest(requestId, groupIds, detailIds, items);
    }

    private List<String> normalizeIds(List<String> values, String field, boolean emptyAllowed) {
        if (values == null || (!emptyAllowed && values.isEmpty())) {
            throw OrderRevisionException.badRequest(field + "를 확인해주세요.");
        }
        if (values.size() > 99) {
            throw OrderRevisionException.badRequest(field + "는 99개 이하이어야 합니다.");
        }
        List<String> normalized = new ArrayList<>(values.stream().map(this::normalize).toList());
        if (normalized.stream().anyMatch(value -> value == null || value.length() > 64)) {
            throw OrderRevisionException.badRequest(field + "를 확인해주세요.");
        }
        normalized.sort(String::compareTo);
        if (new HashSet<>(normalized).size() != normalized.size()) {
            throw OrderRevisionException.badRequest(field + "에 중복 ID를 전송할 수 없습니다.");
        }
        return normalized;
    }

    private Scope requireSingleScope(List<OrderRevisionRows.Target> targets, List<String> requestedIds) {
        if (targets.size() != requestedIds.size()) throw OrderRevisionException.notFound();
        Set<String> masters = new HashSet<>();
        Set<String> tables = new HashSet<>();
        targets.forEach(target -> { masters.add(target.getOrderMasterId()); tables.add(target.getTableSysId()); });
        if (masters.size() != 1 || tables.size() != 1) {
            throw OrderRevisionException.conflict("ORDER_REVISION_SCOPE_CONFLICT",
                    "같은 방문과 테이블의 주문만 한 번에 수정할 수 있습니다.");
        }
        return new Scope(masters.iterator().next(), tables.iterator().next());
    }

    private ValidatedConsumerOrder validateAdditions(String sysPlantCd, NormalizedRequest normalized) {
        ConsumerOrderCreateRequest request = new ConsumerOrderCreateRequest();
        request.setClientRequestId(normalized.clientRequestId());
        request.setItems(normalized.addedItems());
        request.setRequestNote(null);
        try {
            return orderValidator.validate(sysPlantCd, request);
        } catch (ValidationException exception) {
            throw OrderRevisionException.badRequest(exception.getMessage());
        } catch (ConsumerOrderNotFoundException exception) {
            throw OrderRevisionException.menuNotFound(exception.getMessage());
        } catch (ConsumerOrderConflictException exception) {
            throw OrderRevisionException.conflict("ORDER_REVISION_MENU_CONFLICT", exception.getMessage());
        }
    }

    private CreatedOrder createAddedOrder(String sysPlantCd, String userId, String orderMasterId,
                                          ValidatedConsumerOrder order, LocalDateTime now) {
        mapper.lockOrderNumberScope(sysPlantCd);
        int orderNumber = mapper.findNextOrderNumber(sysPlantCd);
        String orderId = newUlid();
        requireSingleInsert(mapper.insertOrderGroup(new OrderRevisionRows.Group(
                orderId, orderMasterId, sysPlantCd, orderNumber, userId, now)), "신규 주문 그룹");
        order.items().forEach(item -> {
            String itemId = newUlid();
            requireSingleInsert(mapper.insertOrderDetail(new OrderRevisionRows.Item(
                    itemId, orderMasterId, orderId, item.menuSysId(), sysPlantCd,
                    item.quantity(), !item.options().isEmpty(), userId, now)), "신규 주문 메뉴");
            item.options().forEach(option -> requireSingleInsert(
                    mapper.insertOrderDetailOption(new OrderRevisionRows.Option(
                    newUlid(), itemId, option.optionSysId(), sysPlantCd,
                    option.storedQuantity(), userId, now)), "신규 주문 옵션"));
        });
        return new CreatedOrder(orderId, Integer.toString(orderNumber), order.totalAmount());
    }

    private void requireSingleInsert(int count, String target) {
        if (count != 1) throw new IllegalStateException(target + "을 저장하지 못했습니다.");
    }

    private OrderRevisionResponse replay(OrderRevisionRows.Revision revision, String fingerprint) {
        if (!fingerprint.equals(revision.getRequestFingerprint())) {
            throw OrderRevisionException.conflict("ORDER_REVISION_PAYLOAD_MISMATCH",
                    "같은 요청 식별자로 다른 주문 수정 내용을 전송할 수 없습니다.");
        }
        if (!"COMPLETED".equals(revision.getProcessingStatus()) || revision.getResponseJson() == null) {
            throw new IllegalStateException("완료되지 않은 주문 수정 멱등성 기록이 남아 있습니다.");
        }
        try {
            return objectMapper.readValue(revision.getResponseJson(), OrderRevisionResponse.class);
        } catch (JacksonException exception) {
            throw new IllegalStateException("저장된 주문 수정 응답을 읽을 수 없습니다.", exception);
        }
    }

    private String writeResponse(OrderRevisionResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JacksonException exception) {
            throw new IllegalStateException("주문 수정 응답을 저장할 수 없습니다.", exception);
        }
    }

    private String normalize(String value) {
        if (value == null) return null;
        String normalized = value.strip();
        return normalized.isEmpty() ? null : normalized;
    }

    private String newUlid() { return UlidCreator.getMonotonicUlid().toString(); }

    private record Scope(String orderMasterId, String tableSysId) {}
    private record NormalizedRequest(String clientRequestId, List<String> orderGroupIds,
                                     List<String> removeDetailIds,
                                     List<htms.QROrder.consumer.order.dto.ConsumerOrderCreateItemRequest> addedItems) {}
    private record CreatedOrder(String orderId, String orderNumber, int totalAmount) {
        private static CreatedOrder none() { return new CreatedOrder(null, null, 0); }
    }
}
