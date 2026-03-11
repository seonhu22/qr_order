package htms.QROrder.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String userId;
    private String userName;
    private String sysPlantCd;
    private boolean initPwdRequired;
}
