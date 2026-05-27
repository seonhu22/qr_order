package htms.QROrder.system.dto;

import htms.QROrder.system.domain.PaymentCoupon;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class PaymentCouponRequest {
    private List<PaymentCoupon> newItems = new ArrayList<>();
    private List<PaymentCoupon> updateItems = new ArrayList<>();
    private List<PaymentCoupon> delItems = new ArrayList<>();
}
