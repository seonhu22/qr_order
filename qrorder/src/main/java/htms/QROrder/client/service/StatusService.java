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
                            String userId) {

        StatusItem.Header header = statusRequest.getHeader();
        String cancelReason = statusRequest.getCancelReason();
        String cancelDescription = statusRequest.getCancelDescription();
        String cancelType = statusRequest.getCancelType();

        statusMapper.cancelOrder(header, cancelType, cancelReason, cancelDescription, userId);
    }

    public void goToCooking(StatusRequest statusRequest,
                            String userId) {

        StatusItem.Header header = statusRequest.getHeader();

        statusMapper.goToCooking(header, userId);
    }

    public void backToReceiveOrder(StatusRequest statusRequest,
                                    String userId) {

        StatusItem.Header header = statusRequest.getHeader();

        statusMapper.backToReceiveOrder(header, userId);
    }

    public void goToServingComplete(StatusRequest statusRequest,
                                        String userId) {

        StatusItem.Header header = statusRequest.getHeader();

        statusMapper.goToServingComplete(header, userId);
    }

    public void backToCooking(StatusRequest statusRequest,
                                String userId) {

        StatusItem.Header header = statusRequest.getHeader();

        statusMapper.backToCooking(header, userId);
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
        paymentCompleteResponse.setBody(statusMapper.getPaymentCompleteBodyItems(header, sysPlantCd));
        paymentCompleteResponse.setFooter(statusMapper.getPaymentCompleteFooterItems(header, sysPlantCd));

        return paymentCompleteResponse;
    }

    public void changeOrder(List<String> listDetailSysId,
                                String userId) {

        statusMapper.changeOrder(listDetailSysId, userId);
    }

    public StatusCancelResponse getStatusCancelResponses(String sysId) {

        return statusMapper.getStatusCancelResponses(sysId);
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
        List<String> orderStatuses = statusMapper.lockPaymentOrderStatuses(sysId, sysPlantCd);
        if (orderStatuses.isEmpty() || orderStatuses.stream().anyMatch(status -> !"03".equals(status))) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "모든 주문의 서빙이 완료된 후 결제할 수 있습니다.");
        }

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

    private void requireOpenPaymentMaster(String sysId, String sysPlantCd) {
        String status = statusMapper.lockPaymentMasterStatus(sysId, sysPlantCd);
        if (status == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "결제 대상 주문을 찾을 수 없습니다.");
        }
        if (!"01".equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 결제 처리가 완료된 주문입니다.");
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
