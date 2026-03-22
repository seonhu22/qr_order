package htms.QROrder.system.dto;

import htms.QROrder.system.domain.PaymentCoupon;
import lombok.Data;

import java.util.List;

@Data
public class PaymentCouponRequest {
    private List<PaymentCoupon> newItems;
    private List<PaymentCoupon> updateItems;
    private List<PaymentCoupon> delItems;
}
