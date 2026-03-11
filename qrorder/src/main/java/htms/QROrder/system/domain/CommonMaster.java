package htms.QROrder.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CommonMaster {
    private String sysId;
    @NotBlank(message = "공통코드는 필수값 입니다.")
    private String commonCd;
    @NotBlank(message = "공통코드명은 필수값 입니다.")
    private String commonNm;
    private String useYn;
}
