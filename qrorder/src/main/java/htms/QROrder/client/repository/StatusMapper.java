package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface StatusMapper {
    List<StatusHeaderItem> getStatusHeaderItems();
    List<StatusBodyItem> getStatusBodyItems();
    List<StatusFooterItem> getStatusFooterItems();
    void cancelOrder(StatusHeaderItem header, String cancelReason, String cancelDescription, String userId);
    void goToCooking(StatusHeaderItem header, String userId);
    void backToReceiveOrder(StatusHeaderItem header, String userId);
    void goToServingComplete(StatusHeaderItem header, String userId);
    void backToCooking(StatusHeaderItem header, String userId);
    void paymentCompleteOrderMaster(String paymentType, String sysId, String userId);
    void paymentCompleteOrderGroup(String sysId, String userId);
    void paymentNotCompleteOrderMaster(String unpaidReason, String unpaidDescription, String sysId, String userId);
    void paymentNotCompleteOrderGroup(String sysId, String userId);
    StatusCancelResponse getStatusCancelResponses(StatusHeaderItem header);
    PaymentCompleteHeaderItem getPaymentCompleteHeaders(StatusHeaderItem header);
    List<PaymentCompleteBodyItem> getPaymentCompleteBodyItems(StatusHeaderItem header);
    PaymentCompleteFooterItem getPaymentCompleteFooterItems(StatusHeaderItem header);
}
