package htms.QROrder.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUser {
    private String sysId;
    @NotBlank(message = "사용자 아이디는 필수값입니다.")
    private String userId;
    @NotBlank(message = "사용자 명은 필수값입니다.")
    private String userNm;
    private String passwordFailCnt;
    private String initYn;
    @NotBlank(message = "사업장은 필수값입니다.")
    private String plantCd;
}
