package htms.Initial.auth.domain;

import lombok.Data;

@Data
public class Login {
    private String sysId;
    private String userId;
    private String userName;
    private String deptCd;
    private String deptNm;
    private String userPassword;
    private Integer passwordFailCnt;
    private String initYn;
    private String useYn;
    private String sysPlantCd;
}
