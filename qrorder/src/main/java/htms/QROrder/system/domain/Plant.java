package htms.QROrder.system.domain;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class Plant {
    private String sysId;
    @NotBlank(message = "사업장 코드는 필수입니다.")
    private String plantCd;
    @NotBlank(message = "사업장 명은 필수입니다.")
    private String plantNm;
    @NotBlank(message = "이메일 주소는 필수입니다.")
    private String emailUrl;
    private String storeNm;
    private String zipCode;
    private String address;
    private String phoneNumber;
    private String useYn;
}
