package htms.QROrder.auth.domain;

import lombok.Data;

@Data
public class Login {
    private String sysId;
    private String userId;
    private String userNm;
    private String userPassword;
    private Integer passwordFailCnt;
    private String initYn;
    private String sysPlantCd;
}
