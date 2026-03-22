package htms.QROrder.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RuleDetail {
    private String sysId;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private String linkSysId;
    @NotBlank(message = "규칙 코드는 필수값입니다.")
    private String optionCd;
    @NotBlank(message = "규칙 명은 필수값입니다.")
    private String optionNm;
    @NotBlank(message = "규칙은 필수입니다.")
    private String optionData;
    private String description;
}
