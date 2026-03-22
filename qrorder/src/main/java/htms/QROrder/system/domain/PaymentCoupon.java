package htms.QROrder.system.domain;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PaymentCoupon {
    private String sysId;
    private String couponCd;
    private String couponNm;
    private LocalDate startDate;
    private LocalDate endDate;
    private String useYn;
}
