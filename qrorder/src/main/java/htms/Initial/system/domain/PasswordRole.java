package htms.Initial.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordRole {
    private String sysId;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private String linkSysId;
    private String plantCd;
    private String plantNm;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private String useYn;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private Long minLength;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private Long maxLength;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private Long minUppercase;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private Long minLowercase;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private Long minNumber;
    @NotBlank(message = "필수값 에러입니다. 관리자에게 문의해주세요.")
    private Long minSpecial;
}
