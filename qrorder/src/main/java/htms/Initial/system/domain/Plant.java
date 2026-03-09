package htms.Initial.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class Plant {
    private String sysId;
    @NotBlank(message = "사업장 코드는 필수입니다.")
    private String plantCd;
    @NotBlank(message = "사업장 명은 필수입니다.")
    private String plantNm;
    @NotBlank(message = "사업장 도메인은 필수입니다.")
    private String domainUrl;
    private String emailUrl;
    @NotBlank(message = "필수값 오류가 발생했습니다. 관리자에게 문의 해주세요.")
    private String emailUrlUseYn;
    private String useYn;
}
