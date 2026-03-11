package htms.QROrder.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommonDetail {
    private String sysId;
    @NotBlank(message = "공통코드는 필수값 입니다.")
    private String linkSysId;
    private String masterCommonCd;
    private String commonCd;
    @NotBlank(message = "공통코드명은 필수값 입니다.")
    private String commonNm;
    @NotBlank(message = "순번은 필수값 입니다.")
    private Integer ordNo;
    private String useYn;
}
