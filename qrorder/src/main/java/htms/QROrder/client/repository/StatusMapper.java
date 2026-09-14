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
    int cancelOrder(@Param("header") StatusItem.Header header, @Param("cancelType") String cancelType,
                    @Param("cancelReason") String cancelReason, @Param("cancelDescription") String cancelDescription,
                    @Param("userId") String userId, @Param("sysPlantCd") String sysPlantCd);
    int goToCooking(@Param("header") StatusItem.Header header, @Param("userId") String userId,
                    @Param("sysPlantCd") String sysPlantCd, @Param("expectedStatus") String expectedStatus);
    int backToReceiveOrder(@Param("header") StatusItem.Header header, @Param("userId") String userId,
                           @Param("sysPlantCd") String sysPlantCd, @Param("expectedStatus") String expectedStatus);
    int goToServingComplete(@Param("header") StatusItem.Header header, @Param("userId") String userId,
                            @Param("sysPlantCd") String sysPlantCd, @Param("expectedStatus") String expectedStatus);
    int backToCooking(@Param("header") StatusItem.Header header, @Param("userId") String userId,
                      @Param("sysPlantCd") String sysPlantCd, @Param("expectedStatus") String expectedStatus);
    String lockOrderGroupStatus(@Param("sysId") String sysId, @Param("sysPlantCd") String sysPlantCd);
    String findConsumerSessionIdByOrderGroup(
            @Param("sysId") String sysId,
            @Param("sysPlantCd") String sysPlantCd);
    String lockPaymentMasterStatus(
            @Param("sysId") String sysId,
            @Param("sysPlantCd") String sysPlantCd);
    List<String> lockPaymentOrderStatuses(
            @Param("sysId") String sysId,
            @Param("sysPlantCd") String sysPlantCd);
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
    StatusCancelResponse getStatusCancelResponses(@Param("sysId") String sysId,
                                                  @Param("sysPlantCd") String sysPlantCd);
    PaymentCompleteResponse.Header getPaymentCompleteHeaders(
            @Param("header") StatusItem.Header header,
            @Param("sysPlantCd") String sysPlantCd);
    List<PaymentCompleteResponse.Body> getPaymentCompleteBodyItems(
            @Param("header") StatusItem.Header header,
            @Param("sysPlantCd") String sysPlantCd);
    PaymentCompleteResponse.Footer getPaymentCompleteFooterItems(
            @Param("header") StatusItem.Header header,
            @Param("sysPlantCd") String sysPlantCd);
    List<String> lockChangeableOrderDetailIds(@Param("listDetailSysId") List<String> listDetailSysId,
                                              @Param("sysPlantCd") String sysPlantCd);
    int changeOrder(@Param("listDetailSysId") List<String> listDetailSysId,
                    @Param("userId") String userId,
                    @Param("sysPlantCd") String sysPlantCd);
}
