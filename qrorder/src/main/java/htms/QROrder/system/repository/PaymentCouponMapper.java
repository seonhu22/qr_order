package htms.QROrder.system.repository;

import htms.QROrder.system.domain.PaymentCoupon;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Mapper
public interface PaymentCouponMapper {
    List<PaymentCoupon> getPaymentCoupon(String searchKeyword);
    void newPaymentCoupon(List<PaymentCoupon> newItems, String userId, String sysPlantCd);
    void updatePaymentCoupon(List<PaymentCoupon> updateItems, String userId, String sysPlantCd);
    void delPaymentCoupon(List<PaymentCoupon> delItems, String userId, String sysPlantCd);
    boolean duplicateChk(List<PaymentCoupon> paymentCoupon);
    List<PaymentCoupon> getDuplicateData(List<PaymentCoupon> paymentCoupon);
}
