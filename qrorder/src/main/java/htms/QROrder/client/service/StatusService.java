package htms.QROrder.client.service;

import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.StatusMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class StatusService {

    private static final Set<String> PAYMENT_TYPES = Set.of("카드", "현금");

    private final StatusMapper statusMapper;

    public List<StatusResponse> getStatus(String sysPlantCd){

        return orderNumClassification(sysPlantCd);
    }

    public void cancelOrder(StatusRequest statusRequest,
                            String userId,
                            String sysPlantCd) {

        StatusItem.Header header = requireOrderHeader(statusRequest);
        requireOrderGroupStatus(header.getSysId(), sysPlantCd, Set.of("01", "02", "03"));
        String cancelReason = statusRequest.getCancelReason();
        String cancelDescription = statusRequest.getCancelDescription();
        String cancelType = statusRequest.getCancelType();

        requireUpdatedOrder(statusMapper.cancelOrder(
                header, cancelType, cancelReason, cancelDescription, userId, sysPlantCd));
    }

    public void goToCooking(StatusRequest statusRequest,
                            String userId,
                            String sysPlantCd) {

        StatusItem.Header header = requireOrderHeader(statusRequest);
        requireOrderGroupStatus(header.getSysId(), sysPlantCd, Set.of("01"));

        requireUpdatedOrder(statusMapper.goToCooking(header, userId, sysPlantCd, "01"));
    }

    public void backToReceiveOrder(StatusRequest statusRequest,
                                    String userId,
                                    String sysPlantCd) {

        StatusItem.Header header = requireOrderHeader(statusRequest);
        requireOrderGroupStatus(header.getSysId(), sysPlantCd, Set.of("02"));

        requireUpdatedOrder(statusMapper.backToReceiveOrder(header, userId, sysPlantCd, "02"));
    }

    public void goToServingComplete(StatusRequest statusRequest,
                                        String userId,
                                        String sysPlantCd) {

        StatusItem.Header header = requireOrderHeader(statusRequest);
        requireOrderGroupStatus(header.getSysId(), sysPlantCd, Set.of("02"));

        requireUpdatedOrder(statusMapper.goToServingComplete(header, userId, sysPlantCd, "02"));
    }

    public void backToCooking(StatusRequest statusRequest,
                                String userId,
                                String sysPlantCd) {

        StatusItem.Header header = requireOrderHeader(statusRequest);
        requireOrderGroupStatus(header.getSysId(), sysPlantCd, Set.of("03"));

        requireUpdatedOrder(statusMapper.backToCooking(header, userId, sysPlantCd, "03"));
    }

    public PaymentCompleteResponse getPaymentComplete(String sysId, String sysPlantCd) {

        StatusItem.Header header = new StatusItem.Header();
        header.setSysId(sysId);

        PaymentCompleteResponse paymentCompleteResponse = new PaymentCompleteResponse();
        PaymentCompleteResponse.Header paymentHeader =
                statusMapper.getPaymentCompleteHeaders(header, sysPlantCd);
        if (paymentHeader == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 대상 주문을 찾을 수 없습니다.");
        }
        paymentCompleteResponse.setHeader(paymentHeader);
        StatusItem.Header visitHeader = new StatusItem.Header();
        visitHeader.setSysId(paymentHeader.getSysId());
        paymentCompleteResponse.setBody(statusMapper.getPaymentCompleteBodyItems(visitHeader, sysPlantCd));
        paymentCompleteResponse.setFooter(statusMapper.getPaymentCompleteFooterItems(visitHeader, sysPlantCd));

        return paymentCompleteResponse;
    }

    public void changeOrder(List<String> listDetailSysId,
                            String userId,
                            String sysPlantCd) {

        if (listDetailSysId == null || listDetailSysId.isEmpty()
                || listDetailSysId.stream().anyMatch(id -> id == null || id.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "변경할 주문 항목이 필요합니다.");
        }
        Set<String> requestedIds = new HashSet<>(listDetailSysId);
        List<String> ownedIds = statusMapper.lockChangeableOrderDetailIds(listDetailSysId, sysPlantCd);
        if (requestedIds.size() != listDetailSysId.size()
                || !new HashSet<>(ownedIds).equals(requestedIds)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "변경할 주문 항목을 찾을 수 없습니다.");
        }
        if (statusMapper.changeOrder(listDetailSysId, userId, sysPlantCd) != requestedIds.size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "주문 상태가 변경되어 수정하지 못했습니다.");
        }
    }

    public StatusCancelResponse getStatusCancelResponses(String sysId, String sysPlantCd) {

        StatusCancelResponse response = statusMapper.getStatusCancelResponses(sysId, sysPlantCd);
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "취소 주문을 찾을 수 없습니다.");
        }
        return response;
    }

    public void paymentComplete(PaymentCompleteRequest paymentCompleteRequest,
                                String userId,
                                String sysPlantCd) {

        if (paymentCompleteRequest == null || !PAYMENT_TYPES.contains(paymentCompleteRequest.getPaymentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 결제수단입니다.");
        }

        PaymentCompleteResponse.Header header = paymentCompleteRequest.getHeader();
        if (header == null || header.getSysId() == null || header.getSysId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 대상 주문 정보가 필요합니다.");
        }
        String sysId = header.getSysId();
        requireOpenPaymentMaster(sysId, sysPlantCd);
        requireAllOrdersServed(sysId, sysPlantCd);

        int updated = statusMapper.paymentCompleteOrderMaster(
                paymentCompleteRequest.getPaymentType(), sysId, userId, sysPlantCd);
        requireOwnedPaymentTarget(updated);
        statusMapper.paymentCompleteOrderGroup(sysId, userId, sysPlantCd);
    }

    public void paymentNotComplete(PaymentNotCompleteRequest paymentNotCompleteRequest,
                                   String userId,
                                   String sysPlantCd) {

        if (paymentNotCompleteRequest == null
                || paymentNotCompleteRequest.getOrderInfo() == null
                || paymentNotCompleteRequest.getOrderInfo().getSysId() == null
                || paymentNotCompleteRequest.getOrderInfo().getSysId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 대상 주문 정보가 필요합니다.");
        }
        String orderMasterSysId = paymentNotCompleteRequest.getOrderInfo().getSysId();
        requireOpenPaymentMaster(orderMasterSysId, sysPlantCd);
        requireAllOrdersServed(orderMasterSysId, sysPlantCd);

        int updated = statusMapper.paymentNotCompleteOrderMaster(
                paymentNotCompleteRequest.getUnpaidReason(),
                paymentNotCompleteRequest.getUnpaidDescription(),
                orderMasterSysId,
                userId,
                sysPlantCd);
        requireOwnedPaymentTarget(updated);
        statusMapper.paymentNotCompleteOrderGroup(orderMasterSysId, userId, sysPlantCd);
    }

    private void requireOwnedPaymentTarget(int updated) {
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 대상 주문을 찾을 수 없습니다.");
        }
    }

    private StatusItem.Header requireOrderHeader(StatusRequest request) {
        if (request == null || request.getHeader() == null
                || request.getHeader().getSysId() == null
                || request.getHeader().getSysId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "주문 정보가 필요합니다.");
        }
        return request.getHeader();
    }

    private void requireOrderGroupStatus(String sysId, String sysPlantCd, Set<String> allowedStatuses) {
        String status = statusMapper.lockOrderGroupStatus(sysId, sysPlantCd);
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다.");
        }
        if (!allowedStatuses.contains(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "허용되지 않은 주문 상태 변경입니다.");
        }
    }

    private void requireUpdatedOrder(int updated) {
        if (updated != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "주문 상태가 변경되어 처리하지 못했습니다.");
        }
    }

    private void requireOpenPaymentMaster(String sysId, String sysPlantCd) {
        String status = statusMapper.lockPaymentMasterStatus(sysId, sysPlantCd);
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 대상 주문을 찾을 수 없습니다.");
        }
        if (!"01".equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 결제 처리가 완료된 주문입니다.");
        }
    }

    private void requireAllOrdersServed(String sysId, String sysPlantCd) {
        List<String> orderStatuses = statusMapper.lockPaymentOrderStatuses(sysId, sysPlantCd);
        if (orderStatuses.isEmpty() || orderStatuses.stream().anyMatch(status -> !"03".equals(status))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "모든 주문의 서빙이 완료된 후 결제할 수 있습니다.");
        }
    }

    private List<StatusResponse> orderNumClassification(String sysPlantCd) {

        List<StatusItem.Header> header = statusMapper.getStatusHeaderItems(sysPlantCd);
        List<StatusItem.Body> body = statusMapper.getStatusBodyItems(sysPlantCd);
        List<StatusItem.Footer> footer = statusMapper.getStatusFooterItems(sysPlantCd);

        List<StatusItem> statusItems = new ArrayList<>();

        header.forEach(head -> {
            StatusItem statusItem = new StatusItem();

            statusItem.setHeader(head);
            statusItem.setBody(body.stream()
                    .filter(b -> b.getLinkSysId().equals(head.getSysId()))
                    .collect(Collectors.toList()));
            statusItem.setFooter(footer.stream()
                    .filter(f -> f.getSysId().equals(head.getSysId()))
                    .findFirst()
                    .orElse(null));

            statusItems.add(statusItem);
        });

        return statusClassification(statusItems);
    }

    private List<StatusResponse> statusClassification(List<StatusItem> statusItems) {

        Map<String, List<StatusItem>> grouped = statusItems.stream()
                .collect(Collectors.groupingBy(item -> item.getHeader().getOrderStatus()));

        List<StatusResponse> statusResponseList = new ArrayList<>();

        grouped.forEach((flag, items) -> {
            StatusResponse statusResponse = new StatusResponse();

            statusResponse.setStatusFlag(flag);
            statusResponse.setStatusList(items);

            statusResponseList.add(statusResponse);
        });

        return statusResponseList;
    }
}
