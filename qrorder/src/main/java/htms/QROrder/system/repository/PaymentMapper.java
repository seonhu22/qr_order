package htms.QROrder.system.repository;

import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.domain.Payment;
import htms.QROrder.system.domain.RuleMaster;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.dto.PaymentResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PaymentMapper {
    List<PaymentResponse> getPayment(String searchKeyword);
    void newPayment(Payment payment, String userId, String sysPlantCd);
    void updatePayment(Payment payment, String userId, String sysPlantCd);
    void delPayment(List<Payment> payment, String userId, String sysPlantCd);
    boolean duplicateChk(Payment payment);
    boolean isPaymentCdUse(Payment payment);

    /** 요금제 행을 sys_id 순서로 잠근다(결제 시작의 플랜 잠금과 직렬화). */
    List<String> lockPayments(@Param("sysIds") List<String> sysIds);
    /** 진행 중 구독(sys_subscription, EXPIRED 아님)이 이 플랜을 쓰고 있다. */
    boolean isPaymentInLiveSubscription(String sysId);
    Payment getOldData(Payment payment);
}
