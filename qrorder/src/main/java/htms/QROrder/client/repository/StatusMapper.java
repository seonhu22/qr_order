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
    void paymentComplete(StatusHeaderItem header, String userId);
    StatusCancelResponse getStatusCancelResponses(StatusHeaderItem header);
}
