package htms.QROrder.system.service;

import com.github.f4b6a3.ulid.UlidCreator;
import htms.QROrder.common.exception.DuplicateException;
import htms.QROrder.system.domain.AdminUser;
import htms.QROrder.system.domain.PaymentCoupon;
import htms.QROrder.system.dto.AdminUserResponse;
import htms.QROrder.system.dto.PaymentCouponRequest;
import htms.QROrder.system.repository.PaymentCouponMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentCouponService {

    private final PaymentCouponMapper paymentCouponMapper;

    public List<PaymentCoupon> getPaymentCoupon(String searchKeyword) {

        return paymentCouponMapper.getPaymentCoupon(searchKeyword);
    }

    public void savePaymentCoupon(PaymentCouponRequest paymentCouponRequest,
                                    String userId,
                                    String sysPlantCd) {

        List<PaymentCoupon> newItems = paymentCouponRequest.getNewItems();
        List<PaymentCoupon> updateItems = paymentCouponRequest.getUpdateItems();
        List<PaymentCoupon> delItems = paymentCouponRequest.getDelItems();

        if(!newItems.isEmpty()){
            if(duplicateChk(newItems)){
                List<PaymentCoupon> duplicateData = getDuplicateData(newItems);

                String result = duplicateData.stream()
                    .map(u -> u.getCouponNm() + "(" + u.getCouponCd() + ")")
                    .collect(Collectors.joining(", "));

                throw new DuplicateException("중복된 데이터가 존재합니다.\n" + result);
            }

            newItems.forEach(item -> {
                item.setSysId(UlidCreator.getUlid().toString());
            });

            newPaymentCoupon(newItems, userId, sysPlantCd);
        }

        if(!updateItems.isEmpty()){
            updatePaymentCoupon(updateItems, userId, sysPlantCd);
        }

        if(!delItems.isEmpty()){
            delPaymentCoupon(delItems, userId, sysPlantCd);
        }
    }

    private void newPaymentCoupon(List<PaymentCoupon> newItems,
                                    String userId,
                                    String sysPlantCd) {

        paymentCouponMapper.newPaymentCoupon(newItems,  userId, sysPlantCd);
    }

    private void updatePaymentCoupon(List<PaymentCoupon> updateItems,
                                    String userId,
                                    String sysPlantCd) {

        paymentCouponMapper.updatePaymentCoupon(updateItems,  userId, sysPlantCd);
    }

    private void delPaymentCoupon(List<PaymentCoupon> delItems,
                                    String userId,
                                    String sysPlantCd) {

        paymentCouponMapper.delPaymentCoupon(delItems,  userId, sysPlantCd);
    }

    private boolean duplicateChk(List<PaymentCoupon> paymentCoupons) {

        return paymentCouponMapper.duplicateChk(paymentCoupons);
    }

    private List<PaymentCoupon> getDuplicateData(List<PaymentCoupon> paymentCoupons) {

        return paymentCouponMapper.getDuplicateData(paymentCoupons);
    }
}
