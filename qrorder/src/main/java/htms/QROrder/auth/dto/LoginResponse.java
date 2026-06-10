package htms.QROrder.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String userId;
    private String userName;
    private String sysPlantCd;
    private String role;
    private String staffRole;
    private boolean initPwdRequired;
}
