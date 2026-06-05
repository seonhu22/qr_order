package htms.QROrder.auth.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class SignUpRequest {
    private String businessRegiNum;
    private String plantNm;
    private String userNm;
    private LocalDate businessRegiDate;
    private String sysId;
    private String userId;
    private String password;
    private String passwordChk;
    private String email;
    private Integer phoneNumber;
}
