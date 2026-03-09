package htms.Initial.common.dto;

import lombok.Data;

@Data
public class CommonDeptUser {
    private Long sysId;
    private String deptCd;
    private String deptNm;
    private String userId;
    private String userNm;
}
