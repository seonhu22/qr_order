package htms.QROrder.auth.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class SignUpRequest {
    private String sysId;
    private String userId;
    private String userNm;
    private String password;
    private String passwordChk;
}
