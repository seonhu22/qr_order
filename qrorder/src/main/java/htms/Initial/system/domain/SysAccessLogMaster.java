package htms.Initial.system.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SysAccessLogMaster {
    private String sysId;
    private String userId;
    private String userNm;
    private String ipAddress;
    private String failReason;
    private LocalDateTime loginDatetime;
    private LocalDateTime logoutDatetime;
}
