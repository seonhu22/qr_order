package htms.QROrder.system.dto;

import lombok.Data;

@Data
public class PaymentResponse {
    private String sysId;
    private String plantCd;
    private String plantNm;
    private String paymentCd;
    private String paymentNm;
    private Integer paymentFee;
    private String paymentFeeUnit;
    private Integer licenseValidMonth;
}
