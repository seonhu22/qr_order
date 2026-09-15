package htms.QROrder.consumer.order.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.common.service.SSEEmitterService;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.consumer.order.service.ConsumerOrderSessionGuard;
import htms.QROrder.consumer.session.dto.ConsumerSessionBinding;
import htms.QROrder.consumer.session.dto.ConsumerVisitRecord;
import htms.QROrder.consumer.session.service.ConsumerVisitService;
import htms.QROrder.qr.dto.QrConnectResponse;
import htms.QROrder.consumer.order.dto.ConsumerStaffCallRequest;
import htms.QROrder.consumer.order.dto.ConsumerStaffCallResponse;
import htms.QROrder.consumer.order.repository.ConsumerStaffCallMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ConsumerStaffCallService {

    private final ConsumerStaffCallMapper consumerStaffCallMapper;
    private final ConsumerVisitService visitService;
    private final ConsumerOrderSessionGuard sessionGuard;
    private final SSEEmitterService sseEmitterService;

    public void saveConsumerStaffCall(ConsumerStaffCallRequest request, QrConnectResponse qr,
                                      ConsumerSessionBinding binding) {
        sessionGuard.requireMatchingBinding(qr, binding);
        ConsumerVisitRecord visit = visitService.lockBoundVisit(qr, binding.getConsumerSessionId());
        sessionGuard.requireActiveVisit(visit);
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new ValidationException("호출 항목을 하나 이상 선택해주세요.");
        }
        Map<String, ConsumerStaffCallResponse> settings = consumerStaffCallMapper
                .getConsumerStaffCall(qr.getSysPlantCd()).stream()
                .collect(Collectors.toMap(ConsumerStaffCallResponse::getCallCd, Function.identity(),
                        (first, duplicate) -> first));
        Set<String> requestedCallCodes = new HashSet<>();
        List<ValidatedCallItem> validatedItems = new ArrayList<>();
        for (ConsumerStaffCallRequest.Item item : request.getItems()) {
            if (item == null) {
                throw new ValidationException("유효하지 않은 직원호출 항목입니다.");
            }
            String callCd = item.getCallCd() == null ? "" : item.getCallCd().trim();
            int quantity = item.getQuantity() == null ? 1 : item.getQuantity();
            ConsumerStaffCallResponse setting = settings.get(callCd);
            if (callCd.isEmpty() || quantity < 1 || quantity > 99 || setting == null
                    || !requestedCallCodes.add(callCd)) {
                throw new ValidationException("유효하지 않은 직원호출 항목입니다.");
            }
            validatedItems.add(new ValidatedCallItem(callCd, quantity, setting.getCallNm()));
        }

        List<Map<String, Object>> eventItems = validatedItems.stream().map(item -> {
            consumerStaffCallMapper.saveConsumerStaffCall(
                    UlidCreator.getMonotonicUlid().toString(), item.callCd(),
                    "수량: " + item.quantity(), qr.getSysPlantCd());
            Map<String, Object> value = new LinkedHashMap<>();
            value.put("callCd", item.callCd());
            value.put("callName", item.callName());
            value.put("quantity", item.quantity());
            return value;
        }).toList();
        LocalDateTime calledAt = LocalDateTime.now();
        Map<String, Object> event = Map.of(
                "tableSysId", qr.getSysId(), "tableName", qr.getTableName(),
                "items", eventItems, "calledAt", calledAt);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() {
                sseEmitterService.send("client:" + qr.getSysPlantCd(), "STAFF_CALLED", event);
            }
        });
    }

    public List<ConsumerStaffCallResponse> getConsumerStaffCall(
            QrConnectResponse qr, ConsumerSessionBinding binding) {
        sessionGuard.requireMatchingBinding(qr, binding);
        sessionGuard.requireActiveVisit(visitService.findBoundVisit(qr, binding.getConsumerSessionId()));
        return consumerStaffCallMapper.getConsumerStaffCall(qr.getSysPlantCd());
    }

    private record ValidatedCallItem(String callCd, int quantity, String callName) {}
}
