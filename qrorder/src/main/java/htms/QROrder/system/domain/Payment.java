package htms.QROrder.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class Payment {
    private String sysId;
    @NotBlank(message = "사업장은필수입니다.")
    private String plantCd;
    @NotBlank(message = "결제요금코드는 필수입니다.")
    private String paymentCd;
    @NotBlank(message = "결제요금명은 필수입니다.")
    private String paymentNm;
    @NotBlank(message = "결제요금은 필수입니다.")
    private Integer paymentFee;
    @NotBlank(message = "결제요금단위는 필수입니다.")
    private String paymentFeeUnit;
    @NotBlank(message = "라이센스 기간(월)은 필수입니다.")
    private Integer licenseValidMonth;
}
