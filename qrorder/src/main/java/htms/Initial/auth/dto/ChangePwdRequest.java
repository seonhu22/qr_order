package htms.Initial.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangePwdRequest {
    private Long sysId;
    @NotBlank(message = "이전 비밀번호 입력은 필수입니다.")
    private String oldPwd;
    @NotBlank(message = "신규 비밀번호 입력은 필수입니다.")
    private String newPwd;
    @NotBlank(message = "확인 비밀번호 입력은 필수입니다.")
    private String chkNewPwd;
}
