package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface StatusMapper {
    List<StatusItem.Header> getStatusHeaderItems(String sysPlantCd);
    List<StatusItem.Body> getStatusBodyItems(String sysPlantCd);
    List<StatusItem.Footer> getStatusFooterItems(String sysPlantCd);
    void cancelOrder(StatusItem.Header header, String cancelType, String cancelReason, String cancelDescription, String userId);
    void goToCooking(StatusItem.Header header, String userId);
    void backToReceiveOrder(StatusItem.Header header, String userId);
    void goToServingComplete(StatusItem.Header header, String userId);
    void backToCooking(StatusItem.Header header, String userId);
    void paymentCompleteOrderMaster(String paymentType, String sysId, String userId);
    void paymentCompleteOrderGroup(String sysId, String userId);
    void paymentNotCompleteOrderMaster(String unpaidReason, String unpaidDescription, String sysId, String userId);
    void paymentNotCompleteOrderGroup(String sysId, String userId);
    StatusCancelResponse getStatusCancelResponses(String sysId);
    PaymentCompleteResponse.Header getPaymentCompleteHeaders(StatusItem.Header header);
    List<PaymentCompleteResponse.Body> getPaymentCompleteBodyItems(StatusItem.Header header);
    PaymentCompleteResponse.Footer getPaymentCompleteFooterItems(StatusItem.Header header);
    void changeOrder(List<String> listDetailSysId, String userId);
}