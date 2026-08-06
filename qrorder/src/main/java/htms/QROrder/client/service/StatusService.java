package htms.QROrder.client.service;

import htms.QROrder.client.dto.*;
import htms.QROrder.client.repository.StatusMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class StatusService {

    private final StatusMapper statusMapper;

    public List<StatusResponse> getStatus(String sysPlantCd){

        return orderNumClassification(sysPlantCd);
    }

    public void cancelOrder(StatusRequest statusRequest,
                            String userId) {

        StatusItem.Header header = statusRequest.getHeader();
        String cancelReason = statusRequest.getCancelReason();
        String cancelDescription = statusRequest.getCancelDescription();

        statusMapper.cancelOrder(header, cancelReason, cancelDescription, userId);
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

    public PaymentCompleteResponse getPaymentComplete(String sysId) {

        StatusItem.Header header = new StatusItem.Header();
        header.setSysId(sysId);

        PaymentCompleteResponse paymentCompleteResponse = new PaymentCompleteResponse();
        paymentCompleteResponse.setHeader(statusMapper.getPaymentCompleteHeaders(header));
        paymentCompleteResponse.setBody(statusMapper.getPaymentCompleteBodyItems(header));
        paymentCompleteResponse.setFooter(statusMapper.getPaymentCompleteFooterItems(header));

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
                                    String userId) {

        PaymentCompleteResponse.Header header = paymentCompleteRequest.getHeader();
        String sysId = header.getSysId();

        statusMapper.paymentCompleteOrderMaster(paymentCompleteRequest.getPaymentType(), sysId, userId);
        statusMapper.paymentCompleteOrderGroup(sysId, userId);
    }

    public void paymentNotComplete(PaymentNotCompleteRequest paymentNotCompleteRequest,
                                    String userId) {

        String orderMasterSysId = paymentNotCompleteRequest.getOrderInfo().getSysId();

        statusMapper.paymentNotCompleteOrderMaster(paymentNotCompleteRequest.getUnpaidReason(), paymentNotCompleteRequest.getUnpaidDescription(), orderMasterSysId, userId);
        statusMapper.paymentNotCompleteOrderGroup(orderMasterSysId, userId);
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
