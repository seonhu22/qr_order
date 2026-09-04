package htms.QROrder.client.repository;

import htms.QROrder.client.dto.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

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
    int paymentCompleteOrderMaster(
            @Param("paymentType") String paymentType,
            @Param("sysId") String sysId,
            @Param("userId") String userId,
            @Param("sysPlantCd") String sysPlantCd);
    void paymentCompleteOrderGroup(
            @Param("sysId") String sysId,
            @Param("userId") String userId,
            @Param("sysPlantCd") String sysPlantCd);
    int paymentNotCompleteOrderMaster(
            @Param("unpaidReason") String unpaidReason,
            @Param("unpaidDescription") String unpaidDescription,
            @Param("sysId") String sysId,
            @Param("userId") String userId,
            @Param("sysPlantCd") String sysPlantCd);
    void paymentNotCompleteOrderGroup(
            @Param("sysId") String sysId,
            @Param("userId") String userId,
            @Param("sysPlantCd") String sysPlantCd);
    StatusCancelResponse getStatusCancelResponses(String sysId);
    PaymentCompleteResponse.Header getPaymentCompleteHeaders(
            @Param("header") StatusItem.Header header,
            @Param("sysPlantCd") String sysPlantCd);
    List<PaymentCompleteResponse.Body> getPaymentCompleteBodyItems(
            @Param("header") StatusItem.Header header,
            @Param("sysPlantCd") String sysPlantCd);
    PaymentCompleteResponse.Footer getPaymentCompleteFooterItems(
            @Param("header") StatusItem.Header header,
            @Param("sysPlantCd") String sysPlantCd);
    void changeOrder(List<String> listDetailSysId, String userId);
}
