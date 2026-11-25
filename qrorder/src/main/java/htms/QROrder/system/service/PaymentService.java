package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.audit.service.AuditService;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.domain.Payment;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.dto.PaymentResponse;
import htms.QROrder.system.repository.PaymentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentMapper paymentMapper;
    private final AuditService auditService;

    public List<PaymentResponse> getPayment(String searchKeyword) {

        return paymentMapper.getPayment(searchKeyword);
    }

    public void newPayment(Payment payment,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        if(duplicateChk(payment)) {

            throw new DuplicateException("이미 존재하는 데이터입니다.");
        }

        payment.setSysId(UlidCreator.getUlid().toString());

        auditService.insertNewAuditTrailData(payment, payment.getSysId(), menuCd, "sys_payment", userId, sysPlantCd);
        paymentMapper.newPayment(payment, userId, sysPlantCd);
    }

    public void updatePayment(Payment payment,
                                String userId,
                                String sysPlantCd,
                                String menuCd) {

        if(isPaymentCdUse(payment)) {

            throw new ValidationException("해당 코드는 이미 사용중입니다. 편집이 불가합니다.");
        }

        Payment oldData = getOldData(payment);
        if (oldData != null && pricingChanged(oldData, payment)
                && paymentMapper.isPaymentInLiveSubscription(payment.getSysId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "진행 중인 구독이 쓰는 요금제는 금액/단위/기간을 바꿀 수 없습니다.");
        }

        auditService.insertUpdateAuditTrailData(oldData, payment, payment.getSysId(), menuCd, "sys_payment", userId, sysPlantCd);
        paymentMapper.updatePayment(payment, userId, sysPlantCd);
    }

    public void delPayment(List<Payment> payment,
                            String userId,
                            String sysPlantCd,
                            String menuCd) {

        for (Payment item : payment) {
            if (item != null && paymentMapper.isPaymentInLiveSubscription(item.getSysId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "진행 중인 구독이 쓰는 요금제는 삭제할 수 없습니다.");
            }
        }

        auditService.insertDeleteAuditTrailData(payment, menuCd, "sys_payment", userId, sysPlantCd);
        paymentMapper.delPayment(payment, userId, sysPlantCd);
    }

    private boolean duplicateChk(Payment payment) {

        return paymentMapper.duplicateChk(payment);
    }

    private boolean isPaymentCdUse(Payment payment) {

        return paymentMapper.isPaymentCdUse(payment);
    }

    /** 구독 스냅샷과 비교하는 값(금액/단위/기간)이 바뀌는지. 이름만 바꾸는 수정은 허용한다. */
    private static boolean pricingChanged(Payment oldData, Payment payment) {
        return !Objects.equals(oldData.getPaymentFee(), payment.getPaymentFee())
                || !Objects.equals(oldData.getPaymentFeeUnit(), payment.getPaymentFeeUnit())
                || !Objects.equals(oldData.getLicenseValidMonth(), payment.getLicenseValidMonth());
    }

    private Payment getOldData(Payment payment) {

        return paymentMapper.getOldData(payment);
    }
}
