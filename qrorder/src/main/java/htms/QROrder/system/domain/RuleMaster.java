package htms.QROrder.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RuleMaster {
    private String sysId;
    @NotBlank(message = "규칙코드는 필수값입니다.")
    private String ruleCd;
    @NotBlank(message = "규칙명은 필수값입니다.")
    private String ruleNm;
    @NotBlank(message = "사용여부는 필수값입니다.")
    private String useYn;
}
