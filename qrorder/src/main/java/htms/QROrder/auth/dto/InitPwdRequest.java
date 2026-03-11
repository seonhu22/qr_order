package htms.QROrder.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InitPwdRequest {
    @NotBlank(message = "비밀번호는 필수값 입니다.")
    private String password;
    @NotBlank(message = "비밀번호확인은 필수값 입니다.")
    private String chkPassword;
}
